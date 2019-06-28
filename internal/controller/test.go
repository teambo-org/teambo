package controller

import (
	"encoding/json"
	"html/template"
	"log"
	"net/http"
	"strings"

	"github.com/teambo-org/teambo/internal/asset"
	"github.com/teambo-org/teambo/internal/util"
)

func Test(w http.ResponseWriter, r *http.Request) {
	if util.Config.Get("app.testing") != "true" {
		res, _ := json.Marshal(map[string]string{"error": "Tests not enabled"})
		http.Error(w, string(res), 403)
		return
	}
	t, err := template.ParseFiles("template/layout.html")
	if err != nil {
		res, _ := json.Marshal(map[string]string{"error": err.Error()})
		http.Error(w, string(res), 500)
		return
	}

	p := getTestPage()

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

	err = t.Execute(w, p)
	if err != nil {
		log.Println("TEMPLATE ERROR - " + err.Error())
	}
}

func getTestPage() Page {
	manifest := []string{}
	if util.Config.Get("app.manifest") == "true" {
		manifest = []string{
			"/app.manifest",
		}
	}
	return Page{
		JSLIB:    hash_version(asset.TestRegistry.Get("jslib")),
		JSAPP:    hash_version(asset.TestRegistry.Get("jsapp")),
		JSASYNC:  hash_version(asset.TestRegistry.Get("jsasync")),
		JSINIT:   []string{"/init.js?v=" + jsinit_version()},
		CSSAPP:   hash_version(asset.TestRegistry.Get("cssapp")),
		CSSLIB:   hash_version(asset.TestRegistry.Get("csslib")),
		AUDIO:    find_audio(),
		IMAGE:    find_images(),
		MANIFEST: manifest,
	}
}
