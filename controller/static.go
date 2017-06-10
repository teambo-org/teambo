package controller

import (
	"../util"
	"../asset"
	// "../app/apptools"
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
	"io"
	"log"
)

func ServeStatic(prefix string, w http.ResponseWriter, r *http.Request) {
	path := prefix + r.URL.Path
	modTime := time.Now().UTC()
	a := asset.Registry.Find(r.URL.Path)
	if a.Url == r.URL.Path {
		modTime = a.GetModTime()
	} else {
		stat, err := os.Stat(path)
		if err != nil {
			http.Error(w, "Not Found : "+r.URL.Path, 404)
			return
		}
		modTime = stat.ModTime()
	}
	// 304
	modHdr := r.Header.Get("If-Modified-Since")
	w.Header().Set("Last-Modified", modTime.UTC().Format(time.RFC1123))
	hdrModTime, err := time.Parse(time.RFC1123, modHdr)
	if err == nil && modHdr != "" && modTime.Unix() <= hdrModTime.Unix() {
		w.WriteHeader(304)
		return
	}
	// Serve file
	file := []byte("")
	ext := filepath.Ext(path)
	mimetype := mime.TypeByExtension(ext)
	if a.Url == r.URL.Path {
		file, _ = ioutil.ReadAll(a.GetReader())
		log.Printf("%s %d", r.URL.Path, len(file))
	} else {
		file, _ = ioutil.ReadFile(path)
	}
	if mimetype == "" {
		mimetype = http.DetectContentType(file)
	}
	w.Header().Set("Content-Type", mimetype)
	if util.Config.Get("static.cache") == "true" {
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
	b := &bytes.Buffer{}
	append_min_js_lib(b)
	serve_min_js(b, w, r)
}

func Appjs(w http.ResponseWriter, r *http.Request) {
	b := &bytes.Buffer{}
	append_min_js_app(b)
	serve_min_js(b, w, r)
}

func Libcss(w http.ResponseWriter, r *http.Request) {
	b := &bytes.Buffer{}
	append_min_css_lib(b)
	serve_min_css(b, w, r)
}

func Appcss(w http.ResponseWriter, r *http.Request) {
	b := &bytes.Buffer{}
	append_min_css_app(b)
	serve_min_css(b, w, r)
}

func serve_min_js(b *bytes.Buffer, w http.ResponseWriter, r *http.Request) {
	version := r.FormValue("v")
	w.Header().Set("Content-Type", mimetype_js)
	if util.Config.Get("static.cache") == "true" && version != "" {
		w.Header().Set("Expires", "Mon, 28 Jan 2038 23:30:00 GMT")
		w.Header().Set("Cache-Control", "max-age=315360000")
		HttpCache.Set(r, CacheItem{b.Bytes(), mimetype_js, time.Now().UTC()})
	}
	w.Write(b.Bytes())
}

func serve_min_css(b *bytes.Buffer, w http.ResponseWriter, r *http.Request) {
	version := r.FormValue("v")
	w.Header().Set("Content-Type", mimetype_css)
	if util.Config.Get("static.cache") == "true" && version != "" {
		w.Header().Set("Expires", "Mon, 28 Jan 2038 23:30:00 GMT")
		w.Header().Set("Cache-Control", "max-age=315360000")
		HttpCache.Set(r, CacheItem{b.Bytes(), mimetype_css, time.Now().UTC()})
	}
	w.Write(b.Bytes())
}

func append_min_js_lib(w io.Writer) {
	for _, a := range asset.Registry.Get("jslib") {
		jsmin.Run(a.GetReader(), w)
	}
}

func append_min_js_app(w io.Writer) {
	w.Write([]byte("(function(){"))
	for _, a := range asset.Registry.Get("jsapp") {
		jsmin.Run(a.GetReader(), w)
	}
	append_js_init(w)
	w.Write([]byte("})();"))
}

func append_min_css_lib(b io.Writer) {
	m := minify.New()
	m.AddFunc("text/css", cssminify.Minify)
	for _, a := range asset.Registry.Get("csslib") {
		src, _ := ioutil.ReadAll(a.GetReader())
		min, _ := m.String("text/css", string(src))
		b.Write([]byte(min))
	}
}

func append_min_css_app(b io.Writer) {
	m := minify.New()
	m.AddFunc("text/css", cssminify.Minify)
	for _, a := range asset.Registry.Get("cssapp") {
		src, _ := ioutil.ReadAll(a.GetReader())
		min, _ := m.String("text/css", string(src))
		b.Write([]byte(min))
	}
}
