package main

import (
	"./controller"
	"net/http"
	"compress/gzip"
	"strings"
	"io"
	"path"
	"context"
	"time"
	"fmt"
	// "log"
)

var origin string

type gzipResponseWriter struct {
	io.Writer
	http.ResponseWriter
}
func (w gzipResponseWriter) Write(b []byte) (int, error) {
	return w.Writer.Write(b)
}
func (w gzipResponseWriter) WriteGz(b []byte) (int, error) {
	return w.Write(b)
}

var gzip_blacklist = map[string]bool{
	".jpg": true,
	".jpeg": true,
	".gif": true,
	".png": true,
	".mp3": true,
}

type StaticHandler struct{}

func (h StaticHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// CSRF Origin filter
	if r.Header.Get("Origin") != "" && r.Header.Get("Origin") != origin {
		http.Error(w, "Origin not allowed", 403)
		return
	}
	// start := time.Now()
	h.ServeGzip(w, r)
	// log.Printf("%d %s", time.Since(start).Nanoseconds() / 1e3, r.URL.Path)
}

func (h StaticHandler) ServeGzip(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Vary", "Content-Encoding")
	ctx := r.Context()
	_, ext_blacklisted := gzip_blacklist[path.Ext(r.URL.Path)]
	if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") ||
		strings.Contains(r.Header.Get("Upgrade"), "websocket") ||
		ext_blacklisted {
		new_r := r.WithContext(context.WithValue(ctx, "gzip", false))
		if controller.HttpCache.Serve(w, new_r) {
			return
		}
		h.ServeSingle(w, new_r)
		return
	}
	new_r := r.WithContext(context.WithValue(ctx, "gzip", true))
	w.Header().Set("Content-Encoding", "gzip")
	if controller.HttpCache.Serve(w, new_r) {
		return
	}
	gz := gzip.NewWriter(w)
	defer gz.Close()
	gzw := gzipResponseWriter{Writer: gz, ResponseWriter: w}
	h.ServeSingle(gzw, new_r)
}

func (h StaticHandler) ServeSingle(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "max-age=0, no-cache, must-revalidate")
	if handle, ok := routes[r.URL.Path]; ok {
		w.Header().Set("Server-Time", fmt.Sprintf("%d", time.Now().UTC().UnixNano()/int64(time.Millisecond)))
		handle(w, r)
	} else {
		controller.Static(w, r)
	}
}

func redirectToHttps(config map[string]string) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		// http.Redirect(w, r, "https://"+config["app.host"], http.StatusMovedPermanently) 301
		http.Redirect(w, r, "https://"+config["app.host"], http.StatusFound)
	}
}
