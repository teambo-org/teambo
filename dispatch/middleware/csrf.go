package middleware

import (
	"net/http"
	// "log"
)

func CSRF(ssl bool, host string) func(func(http.ResponseWriter, *http.Request)) func(w http.ResponseWriter, r *http.Request) {
	origin := "https://" + host
	if !ssl {
		origin = "http://" + host
	}
	return func(next func(w http.ResponseWriter, r *http.Request)) func(w http.ResponseWriter, r *http.Request) {
		return func(w http.ResponseWriter, r *http.Request) {
			// CSRF Origin filter
			if r.Header.Get("Origin") != "" && r.Header.Get("Origin") != origin {
				http.Error(w, "Origin not allowed", 403)
				return
			}
			next(w, r)
		}
	}
}
