package main

import (
    "net/http"
    "os"
    "path/filepath"
    "io/ioutil"
    "mime"
    "time"
    "strconv"
    "bitbucket.org/maxhauser/jsmin"
    // "encoding/json"
    // "fmt"
)

func handle_static(w http.ResponseWriter, r *http.Request) {
    if r.URL.Path == "/.perf" {
        return
    }
    if r.URL.Path == "/min.js" {
        compile_js(w, r)
        return
    }
    if r.URL.Path == "/min.css" {
        compile_css(w, r)
        return
    }
    path := "s" + r.URL.Path
    stat, err := os.Stat(path)
    if err != nil {
        http.Error(w, "Not Found : " + r.URL.Path, 404)
        return
    }
    // 304
    modHdr := r.Header.Get("If-Modified-Since")
    modTime := stat.ModTime()
    w.Header().Set("Last-Modified", modTime.UTC().Format(time.RFC1123))
    hdrModTime, err := time.Parse(time.RFC1123, modHdr)
    if(err == nil && modHdr != "" && modTime.Unix() <= hdrModTime.Unix()) {
        w.WriteHeader(304)
        return
    }
    // Serve file
    ext := filepath.Ext(path)
    mimetype := mime.TypeByExtension(ext)
    if config["static.cache"] == "true" {
        w.Header().Set("Expires", "Mon, 28 Jan 2038 23:30:00 GMT")
        w.Header().Set("Cache-Control", "max-age=315360000")
    }
    w.Header().Set("Content-Type", mimetype)
    w.Header().Set("Content-Length", strconv.Itoa(int(stat.Size())))
    file, _ := ioutil.ReadFile(path)
    w.Write(file)
}

func compile_js(w http.ResponseWriter, r *http.Request) {
    if config["static.cache"] == "true" {
        w.Header().Set("Expires", "Mon, 28 Jan 2038 23:30:00 GMT")
        w.Header().Set("Cache-Control", "max-age=315360000")
    }
    w.Header().Set("Content-Type", mime.TypeByExtension(".js"))
    for _, v := range js {
        src, _ := os.Open("s" + v)
        jsmin.Run(src, w)
    }
	append_js_init(w)
}

func compile_css(w http.ResponseWriter, r *http.Request) {
    if config["static.cache"] == "true" {
        w.Header().Set("Expires", "Mon, 28 Jan 2038 23:30:00 GMT")
        w.Header().Set("Cache-Control", "max-age=315360000")
    }
    w.Header().Set("Content-Type", mime.TypeByExtension(".css"))
    for _, v := range css {
        src, _ := ioutil.ReadFile("s" + v)
        w.Write(src)
    }
}