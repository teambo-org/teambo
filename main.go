package main

import (
	"./model"
	"./socket"
	"./util"
	"./dispatch"
	"./service"
	"context"
	"flag"
	"log"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"strconv"
	"time"
)

func main() {
	var config_path *string = flag.String("conf", "app.conf", "Location of config file")
	flag.Parse()
	config := util.ParseConfig(*config_path)

	procs, err := strconv.Atoi(config["app.procs"])
	if err != nil {
		runtime.GOMAXPROCS(procs)
	}

	err = model.GlobalInit()
	if err != nil {
		log.Println(err.Error())
		log.Fatal("Could not open DB for writing")
	}

	model.TeamIntegrityCache.Init([]string{"comment", "folder", "item", "member", "plan", "wiki"})
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

	dh := dispatch.NewHandler()
	// app.NewRegistry(dh)
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
