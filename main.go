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
)

type Response map[string]interface{}

type StaticHandler struct{}

func (h StaticHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "max-age=0, must-revalidate")
	switch r.URL.Path {
	case "/":
		controller.Index(w, r)
	case "/acct":
		controller.Acct(w, r)
	case "/acct/auth":
		controller.AcctAuth(w, r)
	case "/acct/verification":
		controller.AcctVerification(w, r)
	case "/team":
		controller.Team(w, r)
	case "/buckets":
		controller.Buckets(w, r)
	case "/bucket":
		controller.Bucket(w, r)
	case "/bucket/remove":
		controller.BucketRemove(w, r)
	case "/item":
		controller.Item(w, r)
	case "/item/all":
		controller.ItemAll(w, r)
	case "/item/remove":
		controller.ItemRemove(w, r)
	// case "/team/invite":
	// controller.team_invite(w, r)
	case "/app.manifest":
		controller.Manifest(w, r)
	case "/app.manifestweb":
		controller.WebManifest(w, r)
	case "/init.js":
		controller.Initjs(w, r)
	case "/test":
		controller.Test(w, r)
	default:
		controller.Static(w, r)
	}
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
