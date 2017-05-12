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
	JSLIB    []string
	JSAPP    []string
	JSASYNC  []string
	JSINIT   []string
	CSS      []string
	AUDIO    []string
	MANIFEST []string
	IMAGE    []string
	FONT     []string
	DEBUG    bool
}

var jslib = []string{
	"/js/lib/RSA/jsbn.js",
	"/js/lib/RSA/jsbn2.js",
	"/js/lib/RSA/prng4.js",
	"/js/lib/RSA/rng.js",
	"/js/lib/RSA/rsa.js",
	"/js/lib/RSA/rsa2.js",
	"/js/lib/RSA/base64.js",
	"/js/lib/RSA/rsasync.js",
	"/js/lib/sjcl.js",
	"/js/lib/jsuri-1.1.1.js",
	"/js/lib/fastclick.js",
	"/js/lib/mustache.2.2.1.js",
	"/js/lib/localforage.min.js",
	"/js/lib/promise-7.0.4.min.js",
	"/js/lib/classList.js",
	"/js/lib/polyfills.js",
	"/js/lib/color.js",
	"/js/lib/diff_match_patch.js",
}
var jsapp = []string{
	"/js/t.js",
	"/js/t.crypto.js",
	"/js/t.event.js",
	"/js/t.time.js",
	"/js/t.socket.js",
	"/js/t.form.js",
	"/js/t.xhr.js",
	"/js/t.dom.js",
	"/js/t.device.js",
	"/js/t.router.js",
	"/js/t.view.js",
	"/js/t.acct.js",
	"/js/t.audio.js",
	"/js/t.themes.js",
	"/js/t.chat.js",
	"/js/t.schema.js",
	"/js/t.offline.js",
	"/js/t.team.js",
	"/js/t.model.js",
	"/js/t.keybind.js",
	"/js/view/calendar.js",
	"/js/view/autoselect.js",
	"/js/view/autofilter.js",
	"/js/view/progress.js",
	"/js/view/toggle.js",
	"/js/model/comment.js",
	"/js/model/bucket.js",
	"/js/model/item.js",
	"/js/model/plan.js",
	"/js/model/wiki.js",
	"/js/model/member.js",
	"/js/model/history.js",
	"/js/model/invite.js",
	"/js/socket/team.js",
	"/js/socket/inviteResponse.js",
	"/js/socket/inviteAcceptance.js",
	"/js/socket/acct.js",
}
var jsasync = []string{
	// "/js/lib/zxcvbn.js",
}
var jsinit = []string{
	"/init.js",
}
var css = []string{
	"/css/font.css",
	"/css/font-semibold.css",
	"/css/teambo-embedded.css",
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
			JSLIB:    jslib,
			JSASYNC:  jsasync,
			JSAPP:    []string{"/min.js?v=" + js_min_version(jsapp)},
			JSINIT:   []string{},
			CSS:      []string{"/min.css?v=" + css_min_version()},
			DEBUG:    util.Config("debug") == "true",
			MANIFEST: manifest,
		}
	} else {
		p = Page{
			JSLIB:    hash_version(jslib),
			JSAPP:    hash_version(jsapp),
			JSASYNC:  hash_version(jsasync),
			JSINIT:   []string{"/init.js?v=" + jsinit_version()},
			CSS:      hash_version(css),
			DEBUG:    util.Config("debug") == "true",
			MANIFEST: manifest,
		}
	}

	ws_scheme := "ws"
	port := ":" + util.Config("port.http")
	if util.Config("ssl.active") == "true" {
		ws_scheme = "wss"
		port = ":" + util.Config("port.https")
	}
	ws_url := ws_scheme + "://" + util.Config("app.host")
	if port != ":" && port != ":80" && port != ":443" {
		ws_url = ws_url + port
	}

	w.Header().Set("X-Frame-Options", "DENY")
	w.Header().Set("X-XSS-Protection", "1; mode=block")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("X-Permitted-Cross-Domain-Policies", "none")
	w.Header().Set("Content-Security-Policy", "default-src 'self'; style-src 'self' data:; img-src 'self' data:; font-src 'self' data:; connect-src 'self' blob: "+ws_url)
	if util.Config("ssl.active") == "true" {
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
	}
	if util.Config("ssl.hpkp") != "" {
		var keys = ""
		for _, k := range strings.Split(util.Config("ssl.hpkp"), " ") {
			keys = keys + "pin-sha256=\"" + k + "\"; "
		}
		w.Header().Set("Public-Key-Pins", keys+"max-age=30")
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
			JSLIB:   hash_version(jslib),
			JSASYNC: hash_version(jsasync),
			JSAPP:   []string{"/min.js?v=" + js_min_version(jsapp)},
			JSINIT:  []string{},
			CSS:     []string{"/min.css?v=" + css_min_version()},
			AUDIO:   find_audio(),
			IMAGE:   find_images(),
			FONT:    find_fonts(),
		}
	} else {
		p = Page{
			JSLIB:    hash_version(jslib),
			JSAPP:    hash_version(jsapp),
			JSASYNC:  hash_version(jsasync),
			JSINIT:   []string{"/init.js?v=" + jsinit_version()},
			CSS:      hash_version(css),
			AUDIO:    find_audio(),
			IMAGE:    find_images(),
			FONT:     find_fonts(),
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
		tplname := strings.Replace(k, string(os.PathSeparator), "/", -1)
		tpljs = append(tpljs, "'"+tplname+"': "+scripts[k])
	}
	template_scripts := strings.Join(tpljs, ", ")
	audio, _ := json.Marshal(find_audio())
	debug := "false"
	if util.Config("debug") == "true" {
		debug = "true"
	}
	remember_me := "false"
	if util.Config("app.remember_me") == "true" {
		remember_me = "true"
	}
	js_data := "'templates': " + string(templates) + ", " +
		"'template_js': { " + template_scripts + " }, " +
		"'audio': " + string(audio) + ", " +
		"'debug': " + debug + ", " +
		"'app':{'remember_me': " + remember_me + "}"
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
		content, _ := ioutil.ReadFile("assets" + path)
		hasher := md5.New()
		hasher.Write(content)
		ret = append(ret, path+"?v="+hex.EncodeToString(hasher.Sum(nil)))
	}
	return ret
}

func css_min_version() string {
	hasher := md5.New()
	for _, v := range css {
		src, _ := os.Open("assets" + v)
		jsmin.Run(src, hasher)
	}
	return hex.EncodeToString(hasher.Sum(nil))
}

func js_min_version(js []string) string {
	hasher := md5.New()
	hasher.Write([]byte("(function(){"))
	for _, v := range js {
		src, _ := os.Open("assets" + v)
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
		if !f.IsDir() && strings.Contains(filename, string(os.PathSeparator)) {
			tpl, _ := ioutil.ReadFile(path)
			if strings.HasSuffix(filename, ".mustache") {
				tplname := strings.TrimSuffix(filename, ".mustache")
				tplname = strings.Replace(tplname, string(os.PathSeparator), "/", -1)
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
	dir := "assets" + string(os.PathSeparator) + "audio"
	audio := []string{}
	scan := func(path string, f os.FileInfo, err error) error {
		if !f.IsDir() && strings.HasSuffix(path, ".mp3") {
			name := strings.TrimSuffix(path, ".mp3")
			audio = append(audio, strings.TrimPrefix(name, dir+string(os.PathSeparator)))
		}
		return nil
	}
	filepath.Walk(dir, scan)
	return audio
}

func find_images() []string {
	dir := "assets" + string(os.PathSeparator) + "i"
	images := []string{}
	scan := func(path string, f os.FileInfo, err error) error {
		if !f.IsDir() {
			images = append(images, strings.TrimPrefix(path, dir+string(os.PathSeparator)))
		}
		return nil
	}
	filepath.Walk(dir, scan)
	return images
}

func find_fonts() []string {
	dir := "assets" + string(os.PathSeparator) + "font"
	files := []string{}
	scan := func(path string, f os.FileInfo, err error) error {
		if !f.IsDir() {
			files = append(files, strings.TrimPrefix(path, dir+string(os.PathSeparator)))
		}
		return nil
	}
	filepath.Walk(dir, scan)
	return files
}
