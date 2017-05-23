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

var routes = map[string]func(http.ResponseWriter, *http.Request){
	"/":                    controller.Index,
	"/acct":                controller.Acct,
	"/acct/auth":           controller.AcctAuth,
	"/acct/verification":   controller.AcctVerification,
	"/acct/socket":         controller.AcctSocket,
	"/invite":              controller.Invite,
	"/invite/response":     controller.InviteResponse,
	"/invite/acceptance":   controller.InviteAcceptance,
	"/team":                controller.Team,
	"/team/summary":        controller.TeamSummary,
	"/team/integrity":      controller.TeamIntegrity,
	"/team/remove":         controller.TeamRemove,
	"/team/socket":         controller.TeamSocket,
	"/team/members":        controller.Members,
	"/team/member":         controller.Member,
	"/team/member/remove":  controller.MemberRemove,
	"/team/folders":        controller.HandleTeamObjects("folder", true),
	"/team/folder":         controller.HandleTeamObject("folder", true),
	"/team/folder/remove":  controller.HandleTeamObjectRemove("folder", true),
	"/team/items":          controller.HandleTeamObjects("item", true),
	"/team/item":           controller.HandleTeamObject("item", true),
	"/team/item/remove":    controller.HandleTeamObjectRemove("item", true),
	"/team/comments":       controller.HandleTeamObjects("comment", true),
	"/team/comment":        controller.HandleTeamObject("comment", true),
	"/team/comment/remove": controller.HandleTeamObjectRemove("comment", true),
	"/team/plans":          controller.HandleTeamObjects("plan", true),
	"/team/plan":           controller.HandleTeamObject("plan", true),
	"/team/plan/remove":    controller.HandleTeamObjectRemove("plan", true),
	"/team/wikis":          controller.HandleTeamObjects("wiki", true),
	"/team/wiki":           controller.HandleTeamObject("wiki", true),
	"/team/wiki/remove":    controller.HandleTeamObjectRemove("wiki", true),
	"/app.manifest":        controller.Manifest,
	"/app.manifestweb":     controller.WebManifest,
	"/init.js":             controller.Initjs,
	"/test":                controller.Test,
}

func (h StaticHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "max-age=0, no-cache, must-revalidate")
	// start := time.Now()

	// log.Println(r.URL.Path)

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
}

func redirectToHttps(config map[string]string) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		// http.Redirect(w, r, "https://"+config["app.host"], http.StatusMovedPermanently) 301
		http.Redirect(w, r, "https://"+config["app.host"], http.StatusFound)
	}
}
