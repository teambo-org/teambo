package middleware

import (
	"net/http"

	"github.com/teambo-org/teambo/controller"
)

func HttpCache(next func(w http.ResponseWriter, r *http.Request)) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		if controller.HttpCache.Serve(w, r) {
			return
		}
		next(w, r)
	}
}
