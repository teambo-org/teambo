package apptools

import (
	"net/http"
)

type App interface {
	Init(Registry)
}

type Registry interface {
	Init()
	GetDispatchHandler() DispatchHandler
}

type DispatchHandler interface {
	Attach(func(func(w http.ResponseWriter, r *http.Request)) func(w http.ResponseWriter, r *http.Request))
	HandleTeamObject(string, bool) func(w http.ResponseWriter, r *http.Request)
	HandleTeamObjects(string, bool) func(w http.ResponseWriter, r *http.Request)
	HandleTeamObjectRemove(string, bool) func(w http.ResponseWriter, r *http.Request)
}

type Config interface {
	Get(key string) string
}
