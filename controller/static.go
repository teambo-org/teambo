package controller

import (
	"../util"
	"bitbucket.org/maxhauser/jsmin"
	"bytes"
	"github.com/tdewolff/minify"
	cssminify "github.com/tdewolff/minify/css"
	"io/ioutil"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"time"
	// "log"
)

func ServeStatic(prefix string, w http.ResponseWriter, r *http.Request) {
	path := prefix + r.URL.Path
	stat, err := os.Stat(path)
	if err != nil {
		http.Error(w, "Not Found : "+r.URL.Path, 404)
		return
	}
	// 304
	modHdr := r.Header.Get("If-Modified-Since")
	modTime := stat.ModTime()
	w.Header().Set("Last-Modified", modTime.UTC().Format(time.RFC1123))
	hdrModTime, err := time.Parse(time.RFC1123, modHdr)
	if err == nil && modHdr != "" && modTime.Unix() <= hdrModTime.Unix() {
		w.WriteHeader(304)
		return
	}
	// Serve file
	ext := filepath.Ext(path)
	mimetype := mime.TypeByExtension(ext)
	file, _ := ioutil.ReadFile(path)
	if mimetype == "" {
		mimetype = http.DetectContentType([]byte(file))
	}
	w.Header().Set("Content-Type", mimetype)
	if util.Config("static.cache") == "true" {
		w.Header().Set("Expires", "Mon, 28 Jan 2038 23:30:00 GMT")
		w.Header().Set("Cache-Control", "max-age=315360000")
		HttpCache.Set(r, CacheItem{file, mimetype, modTime})
	}
	w.Write(file)
}

func StaticHandler(prefix string) func(w http.ResponseWriter, r *http.Request) {
	return func (w http.ResponseWriter, r *http.Request) {
		ServeStatic(prefix, w, r)
	}
}

func Libjs(w http.ResponseWriter, r *http.Request) {
	version := r.FormValue("v")
	w.Header().Set("Content-Type", mimetype_js)
	b := &bytes.Buffer{}
	for _, v := range jslib {
		src, _ := os.Open("assets" + v)
		jsmin.Run(src, b)
	}
	if util.Config("static.cache") == "true" && version != "" {
		w.Header().Set("Expires", "Mon, 28 Jan 2038 23:30:00 GMT")
		w.Header().Set("Cache-Control", "max-age=315360000")
		HttpCache.Set(r, CacheItem{b.Bytes(), mimetype_js, time.Now().UTC()})
	}
	w.Write(b.Bytes())
}

func Appjs(w http.ResponseWriter, r *http.Request) {
	version := r.FormValue("v")
	w.Header().Set("Content-Type", mimetype_js)
	b := &bytes.Buffer{}
	b.Write([]byte("(function(){"))
	for _, v := range jsapp {
		src, _ := os.Open("assets" + v)
		jsmin.Run(src, b)
	}
	append_js_init(b)
	b.Write([]byte("})();"))
	if util.Config("static.cache") == "true" && version != "" {
		w.Header().Set("Expires", "Mon, 28 Jan 2038 23:30:00 GMT")
		w.Header().Set("Cache-Control", "max-age=315360000")
		HttpCache.Set(r, CacheItem{b.Bytes(), mimetype_js, time.Now().UTC()})
	}
	w.Write(b.Bytes())
}

func Mincss(w http.ResponseWriter, r *http.Request) {
	version := r.FormValue("v")
	w.Header().Set("Content-Type", mimetype_css)
	m := minify.New()
	m.AddFunc("text/css", cssminify.Minify)
	b := &bytes.Buffer{}
	for _, v := range css {
		src, _ := ioutil.ReadFile("assets" + v)
		min, _ := m.String("text/css", string(src))
		b.Write([]byte(min))
	}
	if util.Config("static.cache") == "true" && version != "" {
		w.Header().Set("Expires", "Mon, 28 Jan 2038 23:30:00 GMT")
		w.Header().Set("Cache-Control", "max-age=315360000")
		HttpCache.Set(r, CacheItem{b.Bytes(), mimetype_css, time.Now().UTC()})
	}
	w.Write(b.Bytes())
}

func Fontcss(w http.ResponseWriter, r *http.Request) {
	version := r.FormValue("v")
	w.Header().Set("Content-Type", mimetype_css)
	m := minify.New()
	m.AddFunc("text/css", cssminify.Minify)
	b := &bytes.Buffer{}
	for _, v := range cssfont {
		src, _ := ioutil.ReadFile("assets" + v)
		min, _ := m.String("text/css", string(src))
		b.Write([]byte(min))
	}
	if util.Config("static.cache") == "true" && version != "" {
		w.Header().Set("Expires", "Mon, 28 Jan 2038 23:30:00 GMT")
		w.Header().Set("Cache-Control", "max-age=315360000")
		HttpCache.Set(r, CacheItem{b.Bytes(), mimetype_css, time.Now().UTC()})
	}
	w.Write(b.Bytes())
}
