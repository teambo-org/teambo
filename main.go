package main

import (
	"./controller"
	"./model"
	"./socket"
	"./util"
	"./service"
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"strconv"
	"time"
)

type Response map[string]interface{}

type StaticHandler struct{}

var origin string

func (h StaticHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// CSRF Origin filter
	if r.Header.Get("Origin") != "" && r.Header.Get("Origin") != origin {
		http.Error(w, "Origin not allowed", 403)
		return
	}
	w.Header().Set("Cache-Control", "max-age=0, no-cache, must-revalidate")
	// start := time.Now()
	if handle, ok := routes[r.URL.Path]; ok {
		w.Header().Set("Server-Time", fmt.Sprintf("%d", time.Now().UTC().UnixNano()/int64(time.Millisecond)))
		handle(w, r)
	} else {
		controller.Static(w, r)
	}
	// log.Printf("%d %s", time.Since(start).UnixNano(), r.URL.Path)
}

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
		log.Fatal("Could not open Bolt DB for writing")
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
	if config["ssl.active"] == "true" {
		go http.ListenAndServe(":"+config["port.http"], http.HandlerFunc(redirectToHttps(config)))
		h = &http.Server{Addr: ":" + config["port.https"], Handler: StaticHandler{}}
		go h.ListenAndServeTLS(config["ssl.crt"], config["ssl.key"])
		origin = "https://" + config["app.host"]
	} else {
		h = &http.Server{Addr: ":" + config["port.http"], Handler: StaticHandler{}}
		go h.ListenAndServe()
		origin = "http://" + config["app.host"]
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

func redirectToHttps(config map[string]string) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		// http.Redirect(w, r, "https://"+config["app.host"], http.StatusMovedPermanently) 301
		http.Redirect(w, r, "https://"+config["app.host"], http.StatusFound)
	}
}
