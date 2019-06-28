package main

import (
	"context"
	"flag"
	"log"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"strconv"
	"time"

	"github.com/teambo-org/teambo/internal/app"
	"github.com/teambo-org/teambo/internal/asset"
	"github.com/teambo-org/teambo/internal/dispatch"
	"github.com/teambo-org/teambo/internal/model"
	"github.com/teambo-org/teambo/internal/service"
	"github.com/teambo-org/teambo/internal/socket"
	"github.com/teambo-org/teambo/internal/util"
)

func main() {
	var config_path *string = flag.String("conf", "app.conf", "Location of config file")
	flag.Parse()
	util.Config.Parse(*config_path)
	if !util.Config.Validate() {
		return
	}
	config := util.Config.All()

	err = model.GlobalInit()
	if err != nil {
		log.Println(err.Error())
		log.Fatal("Could not open DB for writing")
	}

	model.TeamIntegrityCache.Init([]string{"comment", "folder", "item", "member", "plan"})
	model.AcctThrottle.Init(config)
	service.EmailQueue.Init()
	service.PurgeExpired.Init()

	socket.Init()

	log.SetOutput(util.Logfilter{os.Stderr, [][]byte{
		[]byte("http: TLS handshake error"),
		[]byte("http2: server: error reading preface"),
	}})

	asset.Registry.Init()
	asset.TestRegistry.Init()

	dh := dispatch.NewHandler()
	registry := app.Registry{
		Config:            &util.Config,
		AssetRegistry:     &asset.Registry,
		AssetTestRegistry: &asset.TestRegistry,
		DispatchHandler:   &dh,
	}
	registry.Init()
	dh.Finalize()

	h := &http.Server{}
	if config["ssl.active"] == "true" {
		log.Printf("Listening on port %s\n", config["port.https"])
		h = &http.Server{Addr: ":" + config["port.https"], Handler: dh}
		go h.ListenAndServeTLS(config["ssl.crt"], config["ssl.key"])
		go http.ListenAndServe(":"+config["port.http"], http.HandlerFunc(dispatch.RedirectToHttps(config)))
	} else {
		log.Printf("Listening on port %s\n", config["port.http"])
		h = &http.Server{Addr: ":" + config["port.http"], Handler: dh}
		go h.ListenAndServe()
	}

	stop := make(chan os.Signal)
	signal.Notify(stop, os.Interrupt)
	<-stop

	log.Println("Shutting down HTTP server ...")
	ctx, _ := context.WithTimeout(context.Background(), 5*time.Second)
	err = h.Shutdown(ctx)
	if err != nil {
		log.Println(err)
	}
	log.Println("Stopping Email Queue ...")
	service.EmailQueue.Stop()
	log.Println("Stopping Sweepers ...")
	service.PurgeExpired.Stop()
	log.Println("Closing Database Connections ...")
	model.CloseAll()
}
