package controller

import (
	"../util"
	"bitbucket.org/maxhauser/jsmin"
	"bytes"
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
	"strconv"
	"strings"
	"time"
)

type Page struct {
	JSLIB    []string
	JSAPP    []string
	JSASYNC  []string
	JSINIT   []string
	CSS      []string
	CSSFONT  []string
	AUDIO    []string
	MANIFEST []string
	IMAGE    []string
	FONT     []string
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
	"/js/app.js",
	"/js/array.js",
	"/js/object.js",
	"/js/async.js",
	"/js/promise.js",
	"/js/crypto.js",
	"/js/event.js",
	"/js/time.js",
	"/js/socket.js",
	"/js/form.js",
	"/js/xhr.js",
	"/js/dom.js",
	"/js/device.js",
	"/js/router.js",
	"/js/view.js",
	"/js/acct.js",
	"/js/audio.js",
	"/js/themes.js",
	"/js/chat.js",
	"/js/schema.js",
	"/js/offline.js",
	"/js/team.js",
	"/js/model.js",
	"/js/keybind.js",
	"/js/manifest.js",
	"/js/acct/verification.js",
	"/js/view/calendar.js",
	"/js/view/autoselect.js",
	"/js/view/autofilter.js",
	"/js/view/progress.js",
	"/js/view/toggle.js",
	"/js/view/history.js",
	"/js/view/comment.js",
	"/js/view/passmeter.js",
	"/js/model/_prototype.js",
	"/js/model/_extend.js",
	"/js/model/comment.js",
	"/js/model/folder.js",
	"/js/model/item.js",
	"/js/model/plan.js",
	"/js/model/wiki.js",
	"/js/model/member.js",
	"/js/model/history.js",
	"/js/model/invite.js",
	"/js/socket/team.js",
	"/js/socket/teamSummary.js",
	"/js/socket/inviteResponse.js",
	"/js/socket/inviteAcceptance.js",
	"/js/socket/acct.js",
}
var jsasync = []string{
	"/js/lib/fractal.js",
	"/js/lib/zxcvbn.js",
}
var jsinit = []string{
	"/init.js",
}
var cssfont = []string{
	"/css/font.css",
	"/css/font-semibold.css",
}
var css = []string{
	"/css/default.css",
	"/css/external.css",
	"/css/dashboard.css",
	"/font/teambo/css/teambo-embedded.css",
}

var mimetype_js = "text/javascript; charset=utf-8"
var mimetype_css = "text/css; charset=utf-8"

func Index(w http.ResponseWriter, r *http.Request) {
	min := r.FormValue("min")
	t, err := template.ParseFiles("templates/layout.html")
	if err != nil {
		res, _ := json.Marshal(map[string]string{"error": err.Error()})
		http.Error(w, string(res), 500)
		return
	}
	manifest := []string{}
	if util.Config.Get("app.manifest") == "true" {
		manifest = []string{
			"/app.manifest",
		}
	}
	p := Page{}
	if util.Config.Get("static.min") == "true" && min != "0" {
		p = Page{
			JSLIB:    []string{"/lib.js?v=" + js_min_lib_version(jslib)},
			JSASYNC:  hash_version(jsasync),
			JSAPP:    []string{"/app.js?v=" + js_min_version(jsapp)},
			JSINIT:   []string{},
			CSS:      []string{"/min.css?v=" + css_min_version(css)},
			CSSFONT:  []string{"/font.css?v=" + css_min_version(cssfont)},
			MANIFEST: manifest,
		}
	} else {
		p = Page{
			JSLIB:    hash_version(jslib),
			JSAPP:    hash_version(jsapp),
			JSASYNC:  hash_version(jsasync),
			JSINIT:   []string{"/init.js?v=" + jsinit_version()},
			CSS:      hash_version(css),
			CSSFONT:  hash_version(cssfont),
			MANIFEST: manifest,
		}
	}

	ws_scheme := "ws"
	port := ":" + util.Config.Get("port.http")
	if util.Config.Get("ssl.active") == "true" {
		ws_scheme = "wss"
		port = ":" + util.Config.Get("port.https")
	}
	ws_url := ws_scheme + "://" + util.Config.Get("app.host")
	if port != ":" && port != ":80" && port != ":443" {
		ws_url = ws_url + port
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("X-Frame-Options", "DENY")
	w.Header().Set("X-XSS-Protection", "1; mode=block")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("X-Permitted-Cross-Domain-Policies", "none")
	w.Header().Set("Content-Security-Policy", "default-src 'self'; style-src 'self' data:; img-src 'self' data:; font-src 'self' data:; connect-src 'self' blob: "+ws_url)
	if util.Config.Get("ssl.active") == "true" {
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
	}
	if util.Config.Get("ssl.hpkp") != "" {
		var keys = ""
		for _, k := range strings.Split(util.Config.Get("ssl.hpkp"), " ") {
			keys = keys + "pin-sha256=\"" + k + "\"; "
		}
		w.Header().Set("Public-Key-Pins", keys+"max-age=30")
	}

	// Index page can be cached by reverse proxy if cache is cleared after every deploy
	// X-Cache-Edge works like s-maxage in that rpc caches resposne but tells clients not to
	// if util.Config.Get("static.cache") == "true" {
	// w.Header().Set("X-Cache-Edge", "0")
	// w.Header().Set("Expires", "Mon, 28 Jan 2038 23:30:00 GMT")
	// w.Header().Set("Cache-Control", "max-age=315360000")
	// }

	b := &bytes.Buffer{}
	err = t.Execute(b, p)
	if err != nil {
		log.Println("TEMPLATE ERROR - " + err.Error())
	}

	if util.Config.Get("static.cache") == "true" {
		modTime := time.Now().UTC()
		w.Header().Set("Last-Modified", modTime.Format(time.RFC1123))
		HttpCache.Set(r, CacheItem{b.Bytes(), "text/html; charset=utf-8", modTime})
	}
	w.Write(b.Bytes())
}

func Initjs(w http.ResponseWriter, r *http.Request) {
	version := r.FormValue("v")
	w.Header().Set("Content-Type", mimetype_js)
	b := &bytes.Buffer{}
	append_js_init(b)
	if util.Config.Get("static.cache") == "true" && version != "" {
		w.Header().Set("Expires", "Mon, 28 Jan 2038 23:30:00 GMT")
		w.Header().Set("Cache-Control", "max-age=315360000")
		modTime := time.Now().UTC()
		w.Header().Set("Last-Modified", modTime.Format(time.RFC1123))
		HttpCache.Set(r, CacheItem{b.Bytes(), mimetype_js, modTime})
	}
	w.Write(b.Bytes())
}

func Manifest(w http.ResponseWriter, r *http.Request) {
	t, err := template.ParseFiles("templates/app.manifest")
	if err != nil {
		res, _ := json.Marshal(map[string]string{"error": err.Error()})
		http.Error(w, string(res), 500)
		return
	}
	p := Page{}
	if util.Config.Get("static.min") == "true" {
		p = Page{
			JSLIB:   []string{"/lib.js?v=" + js_min_lib_version(jslib)},
			JSASYNC: hash_version(jsasync),
			JSAPP:   []string{"/app.js?v=" + js_min_version(jsapp)},
			JSINIT:  []string{},
			CSS:     []string{"/min.css?v=" + css_min_version(css)},
			CSSFONT: []string{"/font.css?v=" + css_min_version(cssfont)},
			AUDIO:   find_audio(),
			IMAGE:   find_images(),
			// FONT:    find_fonts(),
		}
	} else {
		p = Page{
			JSLIB:   hash_version(jslib),
			JSAPP:   hash_version(jsapp),
			JSASYNC: hash_version(jsasync),
			JSINIT:  []string{"/init.js?v=" + jsinit_version()},
			CSS:     hash_version(css),
			CSSFONT: hash_version(cssfont),
			AUDIO:   find_audio(),
			IMAGE:   find_images(),
			// FONT:    find_fonts(),
		}
	}
	var b bytes.Buffer
	err = t.Execute(&b, p)
	if err != nil {
		log.Println("TEMPLATE ERROR - " + err.Error())
	}
	if util.Config.Get("static.cache") == "true" {
		modTime := time.Now().UTC()
		w.Header().Set("Last-Modified", modTime.Format(time.RFC1123))
		HttpCache.Set(r, CacheItem{b.Bytes(), "text/cache-manifest", modTime})
	}
	w.Header().Set("Content-Type", "text/cache-manifest")
	w.Write(b.Bytes())
}

var webmanifest_cache = ""

func WebManifest(w http.ResponseWriter, r *http.Request) {
	t, err := template.ParseFiles("templates/app.manifestweb")
	if err != nil {
		res, _ := json.Marshal(map[string]string{"error": err.Error()})
		http.Error(w, string(res), 500)
		return
	}
	scheme := "http"
	if util.Config.Get("ssl.active") == "true" {
		scheme = scheme + "s"
	}
	url := scheme + "://" + util.Config.Get("app.host")
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
	if util.Config.Get("static.cache") == "true" {
		modTime := time.Now().UTC()
		w.Header().Set("Last-Modified", modTime.Format(time.RFC1123))
		HttpCache.Set(r, CacheItem{b.Bytes(), "application/manifest+json", modTime})
	}
	w.Header().Set("Content-Type", "application/manifest+json")
	w.Write(b.Bytes())
}

// json marshal with SetEscapeHTML to prevent ugly escaping
func safe_json_marshal(content map[string]string) string {
	buffer := &bytes.Buffer{}
	encoder := json.NewEncoder(buffer)
	encoder.SetEscapeHTML(false)
	encoder.Encode(content)
	return string(buffer.Bytes())
}

func append_js_init(w io.Writer) {
	content, scripts := compile_templates()
	templates := safe_json_marshal(content)
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
	app := map[string]interface{}{
		"debug":       false,
		"testing":     false,
		"remember_me": false,
	}
	for k, _ := range app {
		if util.Config.Get("app."+k) == "true" {
			app[k] = true
		}
	}
	if util.Config.Get("app.max_teams") != "" {
		app["max_teams"], _ = strconv.Atoi(util.Config.Get("app.max_teams"))
	}
	jsasync_json, _ := json.Marshal(hash_version(jsasync))
	app_json, _ := json.Marshal(app)
	js_data := "'templates': " + string(templates) + ", " +
		"'template_js': { " + template_scripts + " }, " +
		"'audio': " + string(audio) + ", " +
		"'jsasync': " + string(jsasync_json) + ", " +
		"'app': " + string(app_json)
	js := "Teambo.app.init({" + js_data + "});"
	if util.Config.Get("static.min") == "true" {
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

func css_min_version(files []string) string {
	hasher := md5.New()
	for _, v := range files {
		src, _ := os.Open("assets" + v)
		jsmin.Run(src, hasher)
	}
	return hex.EncodeToString(hasher.Sum(nil))
}

func js_min_lib_version(js []string) string {
	hasher := md5.New()
	for _, v := range js {
		src, _ := os.Open("assets" + v)
		jsmin.Run(src, hasher)
	}
	append_js_init(hasher)
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
			audio = append(audio, strings.TrimPrefix(path, dir+string(os.PathSeparator)))
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
