package main

import (
	"./controller"
	"./model"
	"./util"
	"flag"
	"fmt"
	"golang.org/x/net/http2"
	"log"
	"net/http"
	// "time"
)

type Response map[string]interface{}

type StaticHandler struct{}

var routes = map[string]func(http.ResponseWriter, *http.Request){
	"/":                  controller.Index,
	"/acct":              controller.Acct,
	"/acct/auth":         controller.AcctAuth,
	"/acct/verification": controller.AcctVerification,
	"/team":              controller.Team,
	"/buckets":           controller.HandleTeamObjects("bucket"),
	"/bucket":            controller.HandleTeamObject("bucket"),
	"/bucket/remove":     controller.HandleTeamObjectRemove("bucket"),
	"/items":             controller.HandleTeamObjects("item"),
	"/item":              controller.HandleTeamObject("item"),
	"/item/remove":       controller.HandleTeamObjectRemove("item"),
	"/app.manifest":      controller.Manifest,
	"/app.manifestweb":   controller.WebManifest,
	"/init.js":           controller.Initjs,
	"/test":              controller.Test,
}

func (h StaticHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "max-age=0, must-revalidate")

	// start := time.Now()

	if handle, ok := routes[r.URL.Path]; ok {
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

	err := model.GlobalInit()
	if err != nil {
		log.Println(err.Error())
		log.Fatal("Could not open Bolt DB for writing")
	}

	http.Handle("/", StaticHandler{})

	if config["ssl.active"] == "true" {
		srv := &http.Server{
			Addr: ":"+config["port.https"],
		}
		http2.ConfigureServer(srv, &http2.Server{})
		log.Fatal(srv.ListenAndServeTLS(config["ssl.crt"], config["ssl.key"]))
	} else {
		err := http.ListenAndServe(":"+config["port.http"], nil)
		if err != nil {
			fmt.Println("ERROR - " + err.Error())
		}
	}
}
