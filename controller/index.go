package controller

import (
	"../util"
	"bitbucket.org/maxhauser/jsmin"
	"bytes"
	"compress/gzip"
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"html/template"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
	// "fmt"
)

type Page struct {
	JS       []string
	JSINIT   []string
	CSS      []string
	AUDIO    []string
	MANIFEST []string
	IMAGE    []string
	FONT     []string
	DEBUG    bool
}

var js = []string{
	"/js/lib/sjcl.js",
	"/js/lib/jsuri-1.1.1.js",
	"/js/lib/fastclick.js",
	"/js/lib/mustache.2.2.1.min.js",
	"/js/lib/localforage.min.js",
	"/js/lib/promise-7.0.4.min.js",
	"/js/lib/classList.js",
	"/js/lib/polyfills.js",
	// "/js/lib/zxcvbn.js",
	"/js/t.js",
	"/js/t.xhr.js",
	"/js/t.router.js",
	"/js/t.view.js",
	"/js/t.crypto.js",
	"/js/t.acct.js",
	"/js/t.audio.js",
	"/js/t.themes.js",
	"/js/t.form.js",
	"/js/t.chat.js",
	"/js/t.team.js",
	"/js/t.bucket.js",
	"/js/t.item.js",
}
var jsinit = []string{
	"/init.js",
}
var css = []string{
	"/css/font.css",
	"/css/teambo.css",
	"/css/default.css",
	"/css/dashboard.css",
}

func Index(w http.ResponseWriter, r *http.Request) {
	min := r.FormValue("min")
	t, err := template.ParseFiles("templates/layout.html")
	if err != nil {
		res, _ := json.Marshal(map[string]string{"error": err.Error()})
		http.Error(w, string(res), 500)
		return
	}
	manifest := []string{}
	if util.Config("app.manifest") == "true" {
		manifest = []string{
			"/app.manifest",
		}
	}
	p := Page{}
	if util.Config("static.min") == "true" && min != "0" {
		p = Page{
			JS:       []string{"/min.js?v=" + js_min_version()},
			JSINIT:   []string{},
			CSS:      []string{"/min.css?v=" + css_min_version()},
			DEBUG:    util.Config("debug") == "true",
			MANIFEST: manifest,
		}
	} else {
		p = Page{
			JS:       hash_version(js),
			JSINIT:   []string{"/init.js?v=" + jsinit_version()},
			CSS:      hash_version(css),
			DEBUG:    util.Config("debug") == "true",
			MANIFEST: manifest,
		}
	}

	w.Header().Set("X-Frame-Options", "DENY")
	w.Header().Set("X-XSS-Protection", "1; mode=block")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("X-Permitted-Cross-Domain-Policies", "none")
	w.Header().Set("Content-Security-Policy", "default-src 'self'; style-src 'self' data:; img-src 'self' data:; font-src 'self' data:; connect-src 'self' blob:")
	if util.Config("ssl.active") == "true" {
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
	}

	if util.Config("static.cache") == "true" {
		// w.Header().Set("X-Cache-Edge", "0")
		w.Header().Set("Expires", "Mon, 28 Jan 2038 23:30:00 GMT")
		w.Header().Set("Cache-Control", "max-age=315360000")
	}

	err = t.Execute(w, p)
	if err != nil {
		log.Println("TEMPLATE ERROR - " + err.Error())
	}
}

func Initjs(w http.ResponseWriter, r *http.Request) {
	if util.Config("static.cache") == "true" {
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

var manifest_cache = ""

func Manifest(w http.ResponseWriter, r *http.Request) {
	if manifest_cache != "" {
		w.Write([]byte(manifest_cache))
		return
	}
	t, err := template.ParseFiles("templates/app.manifest")
	if err != nil {
		res, _ := json.Marshal(map[string]string{"error": err.Error()})
		http.Error(w, string(res), 500)
		return
	}
	p := Page{}
	if util.Config("static.min") == "true" {
		p = Page{
			JS:     []string{"/min.js?v=" + js_min_version()},
			JSINIT: []string{},
			CSS:    []string{"/min.css?v=" + css_min_version()},
			AUDIO:  find_audio(),
			IMAGE:  find_images(),
			FONT:   find_fonts(),
		}
	} else {
		p = Page{
			JS:     hash_version(js),
			JSINIT: []string{"/init.js?v=" + jsinit_version()},
			CSS:    hash_version(css),
			AUDIO:  find_audio(),
			IMAGE:  find_images(),
			FONT:   find_fonts(),
		}
	}
	var b bytes.Buffer
	err = t.Execute(&b, p)
	if err != nil {
		log.Println("TEMPLATE ERROR - " + err.Error())
	}
	if util.Config("cache.manifest") == "true" {
		manifest_cache = b.String()
	}
	w.Write(b.Bytes())
}

var webmanifest_cache = ""

func WebManifest(w http.ResponseWriter, r *http.Request) {
	if webmanifest_cache != "" {
		w.Write([]byte(webmanifest_cache))
		return
	}
	t, err := template.ParseFiles("templates/app.manifestweb")
	if err != nil {
		res, _ := json.Marshal(map[string]string{"error": err.Error()})
		http.Error(w, string(res), 500)
		return
	}
	scheme := "http"
	if util.Config("ssl.active") == "true" {
		scheme = scheme + "s"
	}
	url := scheme + "://" + util.Config("app.host")
	p := map[string]string{
		"url":         url,
		"name":        "Teambo",
		"short_name":  "Teambo",
		"description": "What are you doing today?",
		"icon_path":   "/i/icon/teambo",
	}
	var b bytes.Buffer
	err = t.Execute(&b, p)
	if err != nil {
		log.Println("TEMPLATE ERROR - " + err.Error())
	}
	if util.Config("cache.manifest") == "true" {
		webmanifest_cache = b.String()
	}
	w.Write(b.Bytes())
}

func append_js_init(w io.Writer) {
	content, scripts := compile_templates()
	templates, _ := json.Marshal(content)
	keys := []string{}
	tpljs := []string{}
	for k := range scripts {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, k := range keys {
		tpljs = append(tpljs, "'"+k+"': "+scripts[k])
	}
	template_scripts := strings.Join(tpljs, ", ")
	audio, _ := json.Marshal(find_audio())
	debug := "false"
	if util.Config("debug") == "true" {
		debug = "true"
	}
	js_data := "'templates': " + string(templates) + ", " +
		"'template_js': { " + template_scripts + " }, " +
		"'audio': " + string(audio) + ", " +
		"'debug': " + debug
	if util.Config("tests.enabled") == "true" {
		js_data = js_data + ", " + "'testing': true"
	}
	js := "Teambo.init({" + js_data + "});"
	if util.Config("static.min") == "true" {
		jsmin.Run(strings.NewReader(js), w)
	} else {
		w.Write([]byte(js))
	}
}

func hash_version(sources []string) []string {
	ret := []string{}
	for _, path := range sources {
		content, _ := ioutil.ReadFile("s" + path)
		hasher := md5.New()
		hasher.Write(content)
		ret = append(ret, path+"?v="+hex.EncodeToString(hasher.Sum(nil)))
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
	hasher.Write([]byte("(function(){"))
	for _, v := range js {
		src, _ := os.Open("s" + v)
		jsmin.Run(src, hasher)
	}
	append_js_init(hasher)
	hasher.Write([]byte("})();"))
	return hex.EncodeToString(hasher.Sum(nil))
}

func jsinit_version() string {
	hasher := md5.New()
	append_js_init(hasher)
	return hex.EncodeToString(hasher.Sum(nil))
}

func compile_templates() (map[string]string, map[string]string) {
	templates := map[string]string{}
	template_js := map[string]string{}
	scan := func(path string, f os.FileInfo, err error) error {
		filename, _ := filepath.Rel("templates", path)
		if !f.IsDir() && strings.Contains(filename, "/") {
			tpl, _ := ioutil.ReadFile(path)
			if strings.HasSuffix(filename, ".mustache") {
				tplname := strings.TrimSuffix(filename, ".mustache")
				templates[tplname] = string(tpl)
			}
			if strings.HasSuffix(filename, ".js") {
				tplname := strings.TrimSuffix(filename, ".js")
				template_js[tplname] = string(tpl)
			}
		}
		return nil
	}
	filepath.Walk("templates", scan)

	return templates, template_js
}

func find_audio() []string {
	dir := "s/audio"
	audio := []string{}
	scan := func(path string, f os.FileInfo, err error) error {
		if !f.IsDir() && strings.HasSuffix(path, ".mp3") {
			name := strings.TrimSuffix(path, ".mp3")
			audio = append(audio, strings.TrimPrefix(name, dir+"/"))
		}
		return nil
	}
	filepath.Walk(dir, scan)
	return audio
}

func find_images() []string {
	dir := "s/i"
	images := []string{}
	scan := func(path string, f os.FileInfo, err error) error {
		if !f.IsDir() {
			images = append(images, strings.TrimPrefix(path, dir+"/"))
		}
		return nil
	}
	filepath.Walk(dir, scan)
	return images
}

func find_fonts() []string {
	dir := "s/font"
	images := []string{}
	scan := func(path string, f os.FileInfo, err error) error {
		if !f.IsDir() {
			images = append(images, strings.TrimPrefix(path, dir+"/"))
		}
		return nil
	}
	filepath.Walk(dir, scan)
	return images
}
