package middleware

import (
	"../../controller"
	"net/http"
)

func HttpCache(next func(w http.ResponseWriter, r *http.Request)) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		if controller.HttpCache.Serve(w, r) {
			return
		}
		next(w, r)
	}
}
