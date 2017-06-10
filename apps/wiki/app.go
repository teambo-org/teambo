package wiki

import (
	"../../controller"
	//"github.com/teambo-org/apptools"
	"../apptools"
	"net/http"
)

type App struct {
	apptools.App
}

func (app App) Init(r apptools.Registry) {
	dh := r.GetDispatchHandler()
	routes := map[string]func(http.ResponseWriter, *http.Request){
		"/team/wikis":          dh.HandleTeamObjects("wiki", true),
		"/team/wiki":           dh.HandleTeamObject("wiki", true),
		"/team/wiki/remove":    dh.HandleTeamObjectRemove("wiki", true),
		"/js/model/wiki.js":    controller.StaticHandler("apps/wiki/assets"),
	}
	dh.Attach(func (next func(w http.ResponseWriter, r *http.Request)) func(w http.ResponseWriter, r *http.Request) {
		return func(w http.ResponseWriter, r *http.Request) {
			if handler, ok := routes[r.URL.Path]; ok {
				handler(w, r)
			} else {
				next(w, r)
			}
		}
	})
}
