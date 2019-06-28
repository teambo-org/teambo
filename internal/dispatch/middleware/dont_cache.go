package middleware

import (
	"net/http"
)

func DontCache(next func(w http.ResponseWriter, r *http.Request)) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "max-age=0, no-cache, must-revalidate")
		next(w, r)
	}
}
