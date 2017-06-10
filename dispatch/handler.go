package dispatch

import (
	"../controller"
	"../util"
	"./middleware"
	"fmt"
	"net/http"
	"time"
	// "log"
)

func NewHandler() Handler {
	dh := Handler{}
	dh.Attach(middleware.CSRF(util.Config.Get("ssl.active") == "true", util.Config.Get("app.host")))
	dh.Attach(middleware.BodyBuffer)
	dh.Attach(middleware.GzipAware)
	dh.Attach(middleware.HttpCache)
	dh.Attach(middleware.Gzip)
	dh.Attach(middleware.DontCache)
	return dh
}

type Handler struct {
	stack []func(next func(w http.ResponseWriter, r *http.Request)) func(w http.ResponseWriter, r *http.Request)
	final func(w http.ResponseWriter, r *http.Request)
}

func (h *Handler) Attach(m func(func(w http.ResponseWriter, r *http.Request)) func(w http.ResponseWriter, r *http.Request)) {
	h.stack = append(h.stack, m)
}

func (h *Handler) Finalize() {
	h.final = ServeSingle
	for i := len(h.stack); i > 0; i-- {
		h.final = h.stack[i-1](h.final)
	}
}

func (h Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// start := time.Now()
	h.final(w, r)
	// log.Printf("%d %s", time.Since(start).Nanoseconds() / 1e3, r.URL.Path)
}

func (h *Handler) HandleTeamObject(bucket_name string, log_changes bool) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		controller.TeamObject(bucket_name, log_changes, w, r)
	}
}
func (h *Handler) HandleTeamObjects(bucket_name string, log_changes bool) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		controller.TeamObjects(bucket_name, log_changes, w, r)
	}
}
func (h *Handler) HandleTeamObjectRemove(bucket_name string, log_changes bool) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		controller.TeamObjectRemove(bucket_name, log_changes, w, r)
	}
}

func ServeSingle(w http.ResponseWriter, r *http.Request) {
	if handle, ok := routes[r.URL.Path]; ok {
		w.Header().Set("Server-Time", fmt.Sprintf("%d", time.Now().UTC().UnixNano()/int64(time.Millisecond)))
		handle(w, r)
	} else {
		controller.ServeStatic("assets", w, r)
	}
}

func RedirectToHttps(config map[string]string) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		// http.Redirect(w, r, "https://"+config["app.host"], http.StatusMovedPermanently) 301
		http.Redirect(w, r, "https://"+config["app.host"], http.StatusFound)
	}
}
