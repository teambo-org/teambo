package main

import (
	"./controller"
	"./model"
	"./socket"
	"./util"
	"flag"
	"fmt"
	"golang.org/x/net/http2"
	"log"
	"net/http"
	"time"
	"runtime"
	"strconv"
)

type Response map[string]interface{}

type StaticHandler struct{}

var routes = map[string]func(http.ResponseWriter, *http.Request){
	"/":                    controller.Index,
	"/acct":                controller.Acct,
	"/acct/auth":           controller.AcctAuth,
	"/acct/verification":   controller.AcctVerification,
	"/invite":              controller.Invite,
	"/invite/response":     controller.InviteResponse,
	"/team":                controller.Team,
	"/team/remove":         controller.TeamRemove,
	"/team/socket":         controller.TeamSocket,
	"/team/buckets":        controller.HandleTeamObjects("bucket"),
	"/team/bucket":         controller.HandleTeamObject("bucket", true),
	"/team/bucket/remove":  controller.HandleTeamObjectRemove("bucket", true),
	"/team/items":          controller.HandleTeamObjects("item"),
	"/team/item":           controller.HandleTeamObject("item", true),
	"/team/item/remove":    controller.HandleTeamObjectRemove("item", true),
	"/team/comments":       controller.HandleTeamObjects("comment"),
	"/team/comment":        controller.HandleTeamObject("comment", true),
	"/team/comment/remove": controller.HandleTeamObjectRemove("comment", true),
	"/team/members":        controller.HandleTeamObjects("member"),
	"/team/member":         controller.HandleTeamObject("member", true),
	"/team/member/remove":  controller.HandleTeamObjectRemove("member", true),
	"/team/plans":          controller.HandleTeamObjects("plan"),
	"/team/plan":           controller.HandleTeamObject("plan", true),
	"/team/plan/remove":    controller.HandleTeamObjectRemove("plan", true),
	"/team/wikis":          controller.HandleTeamObjects("wiki"),
	"/team/wiki":           controller.HandleTeamObject("wiki", true),
	"/team/wiki/remove":    controller.HandleTeamObjectRemove("wiki", true),
	"/app.manifest":        controller.Manifest,
	"/app.manifestweb":     controller.WebManifest,
	"/init.js":             controller.Initjs,
	"/test":                controller.Test,
}

func (h StaticHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "max-age=0, must-revalidate")
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

	go socket.TeamHub.Run()

	http.Handle("/", StaticHandler{})

	if config["ssl.active"] == "true" {
		srv := &http.Server{
			Addr: ":" + config["port.https"],
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
