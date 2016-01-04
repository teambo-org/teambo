package main

import (
    "html/template"
    "encoding/json"
    "os"
    "path/filepath"
	"io"
    "io/ioutil"
    "strings"
    "net/http"
    "log"
	"time"
	"compress/gzip"
    "bytes"
    "crypto/md5"
    "encoding/hex"
    "bitbucket.org/maxhauser/jsmin"
)

type Page struct{
    JS []string
    JSINIT []string
    CSS []string
    AUDIO []string
	MANIFEST []string
    DEBUG bool
}
var js = []string{
    "/js/lib/json2.js",
    "/js/lib/sjcl.js",
    "/js/lib/jsuri-1.1.1.js",
    "/js/lib/fastclick.js",
    "/js/lib/mustache.js",
    "/js/lib/localforage.min.js",
    "/js/lib/promise-7.0.4.min.js",
    "/js/lib/classList.js",
    "/js/t.js",
    "/js/t.xhr.js",
    "/js/t.router.js",
    "/js/t.crypto.js",
    "/js/t.acct.js",
    "/js/t.chat.js",
    "/js/t.audio.js",
    "/js/t.themes.js",
}
var jsinit = []string{
    "/init.js",
}
var css = []string{
    "/css/fonts.css",
    "/css/default.css",
    "/css/teambo-embedded.css",
}

func handle_index(w http.ResponseWriter, r *http.Request) {
    min := r.FormValue("min")
    t, err := template.ParseFiles("templates/layout.html")
    if err != nil  {
        res, _ := json.Marshal(map[string]string{"error": err.Error()})
        http.Error(w, string(res), 500)
        return
    }
	manifest := []string{}
	if config["app.manifest"] == "true" {
		manifest = []string{
			"/app.manifest",
		}
	}
    p := Page{}
    if(config["static.min"] == "true" && min != "0") {
        p = Page{
            JS: []string{"/min.js?v="+js_min_version()},
            JSINIT: []string{},
            CSS: []string{"/min.css?v="+css_min_version()},
            AUDIO: find_audio(),
            DEBUG: config["debug"] == "true",
			MANIFEST: manifest,
        }
    } else {
        p = Page{
            JS: hash_version(js),
            JSINIT: []string{"/init.js?v="+jsinit_version()},
            CSS: hash_version(css),
            AUDIO: find_audio(),
            DEBUG: config["debug"] == "true",
			MANIFEST: manifest,
        }
    }
    
    w.Header().Set("Strict-Transport-Security", "max-age=31536000")
    w.Header().Set("X-Frame-Options", "DENY")
    w.Header().Set("X-XSS-Protection", "1; mode=block")
    w.Header().Set("X-Content-Type-Options", "nosniff")
    w.Header().Set("X-Permitted-Cross-Domain-Policies", "master-only")
    
    if config["static.cache"] == "true" {
        // w.Header().Set("X-Cache-Edge", "0")
        w.Header().Set("Expires", "Mon, 28 Jan 2038 23:30:00 GMT")
        w.Header().Set("Cache-Control", "max-age=315360000")
    }
    
    err = t.Execute(w, p)
    if err != nil  { log.Println("TEMPLATE ERROR - "+err.Error()) }
}

func handle_init(w http.ResponseWriter, r *http.Request) {
    
    if config["static.cache"] == "true" {
        w.Header().Set("Expires", "Mon, 28 Jan 2038 23:30:00 GMT")
        w.Header().Set("Cache-Control", "max-age=315360000")
    }
    w.Header().Set("Content-Type", "text/javascript; charset=utf-8")
	w.Header().Set("Content-Encoding", "gzip")
	var b bytes.Buffer
	gw := gzip.NewWriter(&b)
	append_js_init(gw)
	gw.Close()
	b.WriteTo(w)
}

func append_js_init(w io.Writer) {
    content := compile_templates()
    templates, _ := json.Marshal(content)
	audio, _ := json.Marshal(find_audio())
	debug := "false"
	if config["debug"] == "true" {
		debug = "true"
	}
	w.Write([]byte("t.init({templates: "+string(templates)+", debug: "+debug+", audio: "+string(audio)+"});"))
}

func hash_version(sources []string) []string {
	ret := []string{}
    for _, path := range sources {
        content, _ := ioutil.ReadFile("s" + path)
		hasher := md5.New()
		hasher.Write(content)
		ret = append(ret, path + "?v=" + hex.EncodeToString(hasher.Sum(nil)))
	}
	return ret
}

func css_min_version() string {
	hasher := md5.New()
    for _, v := range css {
        src, _ := os.Open("s" + v)
        jsmin.Run(src, hasher)
    }
    return hex.EncodeToString(hasher.Sum(nil))
}

func js_min_version() string {
	hasher := md5.New()
    for _, v := range js {
        src, _ := os.Open("s" + v)
        jsmin.Run(src, hasher)
    }
	append_js_init(hasher)
    return hex.EncodeToString(hasher.Sum(nil))
}

func jsinit_version() string {
	hasher := md5.New()
	append_js_init(hasher)
    return hex.EncodeToString(hasher.Sum(nil))
}

func compile_templates() map[string]string {
    content := map[string]string{}
    scan := func (path string, f os.FileInfo, err error) error {
        tplname, _ := filepath.Rel("templates", path)
        if !f.IsDir() && strings.Contains(tplname, "/") {
            tpl, _ := ioutil.ReadFile(path)
            tplname = strings.TrimSuffix(tplname, ".mustache")
            content[tplname] = string(tpl)
        }
        return nil
    }
    filepath.Walk("templates", scan)
    return content
}

func find_audio() []string {
	dir := "s/audio"
	audio := []string{}
    scan := func (path string, f os.FileInfo, err error) error {
        if !f.IsDir() && strings.HasSuffix(path, ".mp3") {
            name := strings.TrimSuffix(path, ".mp3")
            audio = append(audio, strings.TrimPrefix(name, dir+"/"))
        }
        return nil
    }
    filepath.Walk(dir, scan)
    return audio
}

func handle_slow(w http.ResponseWriter, r *http.Request) {
	time.Sleep(time.Second * 4);
    content := "hi"
    w.Header().Set("Content-Type", "text/javascript; charset=utf-8")
    json, _ := json.Marshal(content)
    w.Write([]byte(string(json)))
}


func handle_manifest(w http.ResponseWriter, r *http.Request) {
    t, err := template.ParseFiles("templates/app.manifest")
    if err != nil  {
        res, _ := json.Marshal(map[string]string{"error": err.Error()})
        http.Error(w, string(res), 500)
        return
    }
    p := Page{}
    if(config["static.min"] == "true") {
        p = Page{
            JS: []string{"/min.js?v="+js_min_version()},
            JSINIT: []string{},
            CSS: []string{"/min.css?v="+css_min_version()},
            AUDIO: find_audio(),
        }
    } else {
        p = Page{
            JS: hash_version(js),
            JSINIT: []string{"/init.js?v="+jsinit_version()},
            CSS: hash_version(css),
            AUDIO: find_audio(),
        }
    }
    err = t.Execute(w, p)
    if err != nil  { log.Println("TEMPLATE ERROR - "+err.Error()) }
}
