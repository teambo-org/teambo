package controller

import (
	"../util"
	"../asset"
	"../app/apptools"
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
	CSSAPP   []string
	CSSLIB   []string
	AUDIO    []string
	MANIFEST []string
	IMAGE    []string
	FONT     []string
}

var mimetype_js = "text/javascript; charset=utf-8"
var mimetype_css = "text/css; charset=utf-8"

func Index(w http.ResponseWriter, r *http.Request) {
	t, err := template.ParseFiles("template/layout.html")
	if err != nil {
		res, _ := json.Marshal(map[string]string{"error": err.Error()})
		http.Error(w, string(res), 500)
		return
	}

	p := getPage()

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
	t, err := template.ParseFiles("template/app.manifest")
	if err != nil {
		res, _ := json.Marshal(map[string]string{"error": err.Error()})
		http.Error(w, string(res), 500)
		return
	}

	p := getPage()

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
	t, err := template.ParseFiles("template/app.manifestweb")
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

func getPage() Page {
	manifest := []string{}
	if util.Config.Get("app.manifest") == "true" {
		manifest = []string{
			"/app.manifest",
		}
	}
	if util.Config.Get("static.min") == "true" {
		return Page{
			JSLIB:    []string{"/lib.js?v=" + js_min_lib_version()},
			JSASYNC:  hash_version(asset.Registry.Get("jsasync")),
			JSAPP:    []string{"/app.js?v=" + js_min_app_version()},
			JSINIT:   []string{},
			CSSAPP:   []string{"/app.css?v=" + css_min_app_version()},
			CSSLIB:   []string{"/lib.css?v=" + css_min_lib_version()},
			AUDIO:    find_audio(),
			IMAGE:    find_images(),
			MANIFEST: manifest,
		}
	}
	return Page{
		JSLIB:    hash_version(asset.Registry.Get("jslib")),
		JSAPP:    hash_version(asset.Registry.Get("jsapp")),
		JSASYNC:  hash_version(asset.Registry.Get("jsasync")),
		JSINIT:   []string{"/init.js?v=" + jsinit_version()},
		CSSAPP:   hash_version(asset.Registry.Get("cssapp")),
		CSSLIB:   hash_version(asset.Registry.Get("csslib")),
		AUDIO:    find_audio(),
		IMAGE:    find_images(),
		MANIFEST: manifest,
	}
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
	content := asset.Registry.ResolveTemplates()
	scripts := asset.Registry.ResolveTemplatejs()
	templates := safe_json_marshal(content)
	keys := []string{}
	tpljs := []string{}
	for k := range scripts {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, k := range keys {
		tplname := strings.Replace(k, string(os.PathSeparator), "/", -1)
		tpljs = append(tpljs, "\""+tplname+"\": "+scripts[k])
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
	jsasync_json, _ := json.Marshal(hash_version(asset.Registry.Get("jsasync")))
	app_json, _ := json.Marshal(app)
	js_data := "\"templates\": " + string(templates) + ", " +
		"\"template_js\": { " + template_scripts + " }, " +
		"\"audio\": " + string(audio) + ", " +
		"\"jsasync\": " + string(jsasync_json) + ", " +
		"\"app\": " + string(app_json)
	js := "Teambo.app.init({" + js_data + "});"
	if util.Config.Get("static.min") == "true" {
		jsmin.Run(strings.NewReader(js), w)
	} else {
		w.Write([]byte(js))
	}
}

func hash_version(sources []apptools.Asset) []string {
	ret := []string{}
	for _, a := range sources {
		content, _ := ioutil.ReadAll(a.GetReader())
		hasher := md5.New()
		hasher.Write(content)
		ret = append(ret, a.Url+"?v="+hex.EncodeToString(hasher.Sum(nil)))
	}
	return ret
}

func css_min_lib_version() string {
	hasher := md5.New()
	append_min_css_lib(hasher)
	return hex.EncodeToString(hasher.Sum(nil))
}

func css_min_app_version() string {
	hasher := md5.New()
	append_min_css_app(hasher)
	return hex.EncodeToString(hasher.Sum(nil))
}

func js_min_lib_version() string {
	hasher := md5.New()
	append_min_js_lib(hasher)
	return hex.EncodeToString(hasher.Sum(nil))
}

func js_min_app_version() string {
	hasher := md5.New()
	append_min_js_app(hasher)
	return hex.EncodeToString(hasher.Sum(nil))
}

func jsinit_version() string {
	hasher := md5.New()
	append_js_init(hasher)
	return hex.EncodeToString(hasher.Sum(nil))
}

func find_audio() []string {
	dir := "public" + string(os.PathSeparator) + "audio"
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
	dir := "public" + string(os.PathSeparator) + "i"
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
