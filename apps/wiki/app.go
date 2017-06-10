package wiki

import (
	"../../dispatch"
	"../../controller"
	//"github.com/teambo-org/apptools"
	"net/http"
)

type App struct {}

func (a App) Init(dh *dispatch.Handler) {
	dh.Attach(serve)
}

func serve(next func(w http.ResponseWriter, r *http.Request)) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		if handler, ok := routes[r.URL.Path]; ok {
			handler(w, r)
		} else {
			next(w, r)
		}
	}
}

var routes = map[string]func(http.ResponseWriter, *http.Request){
	"/team/wikis":          controller.HandleTeamObjects("wiki", true),
	"/team/wiki":           controller.HandleTeamObject("wiki", true),
	"/team/wiki/remove":    controller.HandleTeamObjectRemove("wiki", true),
	"/js/model/wiki.js":    controller.StaticHandler("apps/wiki/assets"),
}
