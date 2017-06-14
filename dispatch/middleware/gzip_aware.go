package middleware

import (
	"context"
	"net/http"
	"path"
	"strings"
)

var gzip_blacklist = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".gif":  true,
	".png":  true,
	".mp3":  true,
}

func GzipAware(next func(w http.ResponseWriter, r *http.Request)) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Vary", "Content-Encoding")
		ctx := r.Context()
		_, ext_blacklisted := gzip_blacklist[path.Ext(r.URL.Path)]
		gzip_enabled := strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") &&
			!strings.Contains(r.Header.Get("Upgrade"), "websocket") &&
			!ext_blacklisted
		if gzip_enabled {
			w.Header().Set("Content-Encoding", "gzip")
			next(w, r.WithContext(context.WithValue(ctx, "gzip", true)))
		} else {
			next(w, r.WithContext(context.WithValue(ctx, "gzip", false)))
		}
	}
}
