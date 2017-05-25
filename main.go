package main

import (
	"./controller"
	"./model"
	"./socket"
	"./util"
	"flag"
	"fmt"
	"log"
	"net/http"
	"time"
	"runtime"
	"strconv"
	"context"
	"os"
	"os/signal"
)

type Response map[string]interface{}

type StaticHandler struct{}

func (h StaticHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "max-age=0, no-cache, must-revalidate")
	// start := time.Now()
	if handle, ok := routes[r.URL.Path]; ok {
		w.Header().Set("Server-Time", fmt.Sprintf("%d", time.Now().UTC().UnixNano()/int64(time.Millisecond)))
		handle(w, r)
	} else {
		controller.Static(w, r)
	}
	// log.Printf("%d %s", time.Since(start).Nanoseconds(), r.URL.Path)
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
	model.EmailQueue.Init()

	go socket.TeamHub.Run()
	go socket.InviteResponseHub.Run()
	go socket.InviteAcceptanceHub.Run()
	go socket.AcctHub.Run()

	stop := make(chan os.Signal)
	signal.Notify(stop, os.Interrupt)

	log.SetOutput(util.Logfilter{os.Stderr, [][]byte{
		[]byte("http: TLS handshake error"),
		[]byte("http2: server: error reading preface"),
	}})

	h := &http.Server{}
	if config["ssl.active"] == "true" {
		go http.ListenAndServe(":"+config["port.http"], http.HandlerFunc(redirectToHttps(config)))
		h = &http.Server{Addr: ":"+config["port.https"], Handler: StaticHandler{}}
		go h.ListenAndServeTLS(config["ssl.crt"], config["ssl.key"])
	} else {
		h = &http.Server{Addr: ":"+config["port.http"], Handler: StaticHandler{}}
		go h.ListenAndServe()
	}
	<-stop
	log.Println("Shutting down the server...")
	ctx, _ := context.WithTimeout(context.Background(), 5*time.Second)
	err = h.Shutdown(ctx)
	if err != nil {
		log.Println(err)
	}
	log.Println("Stopping email queue...")
	model.EmailQueue.Stop()
}

func redirectToHttps(config map[string]string) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		// http.Redirect(w, r, "https://"+config["app.host"], http.StatusMovedPermanently) 301
		http.Redirect(w, r, "https://"+config["app.host"], http.StatusFound)
	}
}
