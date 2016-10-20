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
	"/buckets":           controller.Buckets,
	"/bucket":            controller.Bucket,
	"/bucket/remove":     controller.BucketRemove,
	"/items":             controller.Items,
	"/item":              controller.Item,
	"/item/remove":       controller.ItemRemove,
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
		log.Fatal("Could not open Bolt DB for writing")
	}

	http.Handle("/", StaticHandler{})

	if config["ssl.active"] == "true" {
		srv := &http.Server{
			Addr: ":443",
		}
		http2.ConfigureServer(srv, &http2.Server{})
		log.Fatal(srv.ListenAndServeTLS(config["ssl.crt"], config["ssl.key"]))
	} else {
		err := http.ListenAndServe(":80", nil)
		if err != nil {
			fmt.Println("ERROR - " + err.Error())
		}
	}
}
