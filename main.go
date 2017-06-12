package main

import (
	"./dispatch"
	"./model"
	"./service"
	"./socket"
	"./util"
	"./app"
	"./asset"
	"context"
	"flag"
	"log"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"strconv"
	"time"
	// "github.com/teambo-org/apptools"
)

func main() {
	var config_path *string = flag.String("conf", "app.conf", "Location of config file")
	flag.Parse()
	util.Config.Parse(*config_path)
	config := util.Config.All()

	if !check_config(config) {
		return
	}

	procs, err := strconv.Atoi(config["app.procs"])
	if err != nil {
		runtime.GOMAXPROCS(procs)
	}

	err = model.GlobalInit()
	if err != nil {
		log.Println(err.Error())
		log.Fatal("Could not open DB for writing")
	}

	model.TeamIntegrityCache.Init([]string{"comment", "folder", "item", "member", "plan"})
	model.AcctThrottle.Init(config)
	service.EmailQueue.Init()
	service.PurgeExpired.Init()

	go socket.TeamHub.Run()
	go socket.InviteResponseHub.Run()
	go socket.InviteAcceptanceHub.Run()
	go socket.AcctHub.Run()

	log.SetOutput(util.Logfilter{os.Stderr, [][]byte{
		[]byte("http: TLS handshake error"),
		[]byte("http2: server: error reading preface"),
	}})

	h := &http.Server{}

	asset.Registry.Init()
	asset.TestRegistry.Init()

	dh := dispatch.NewHandler()
	registry := app.Registry {
		Config: &util.Config,
		AssetRegistry: &asset.Registry,
		AssetTestRegistry: &asset.TestRegistry,
		DispatchHandler: &dh,
	}
	registry.Init()
	dh.Finalize()

	if config["ssl.active"] == "true" {
		go http.ListenAndServe(":"+config["port.http"], http.HandlerFunc(dispatch.RedirectToHttps(config)))
		h = &http.Server{Addr: ":" + config["port.https"], Handler: dh}
		go h.ListenAndServeTLS(config["ssl.crt"], config["ssl.key"])
	} else {
		h = &http.Server{Addr: ":" + config["port.http"], Handler: dh}
		go h.ListenAndServe()
	}

	stop := make(chan os.Signal)
	signal.Notify(stop, os.Interrupt)
	<-stop

	log.Println("Shutting down HTTP server ...")
	ctx, _ := context.WithTimeout(context.Background(), 10*time.Second)
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

func check_config(config map[string]string) bool {
	if config["secret"] == "" || config["secret"] == "EMPTY" {
		log.Println("You must provide a secret in your configuration file")
		log.Println("Here's a random secret you can use:\n\nsecret " + util.RandStr(80) + "\n")
		return false
	}
	if config["acct.verification_required"] != "false" &&
		config["smtp.user"] == "" || config["smtp.user"] == "__USER__" ||
		config["smtp.pass"] == "" || config["smtp.pass"] == "__PASS__" {
		log.Println("You must configure an Email Service Provider under smtp.* (__USER__ / __PASS__)")
		log.Println("Try a free account from mailtrap.io for dev or sendgrid.com for prod")
		return false
	}
	return true
}
