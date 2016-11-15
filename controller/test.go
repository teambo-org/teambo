package controller

import (
	"../util"
	"encoding/json"
	"html/template"
	"log"
	"net/http"
	"strings"
	// "fmt"
)

var tjs = append(jslib, []string{
	"/js/lib/jasmine.2.5.js",
	"/js/lib/jasmine-html.2.5.js",
}...)
var tcss = append(css, []string{
	"/css/lib/jasmine.2.5.css",
}...)
var tests = []string{
	"/js/test/boot.js",
	// "/js/test/t.test.js",
	"/js/test/t.schema.test.js",
	// "/js/test/t.acct.test.js",
	// "/js/test/t.team.test.js",
	// "/js/test/t.bucket.test.js",
	// "/js/test/t.item.test.js",
	// "/js/test/stress.test.js",
}

func Test(w http.ResponseWriter, r *http.Request) {
	if util.Config("tests.enabled") != "true" {
		res, _ := json.Marshal(map[string]string{"error": "Tests not enabled"})
		http.Error(w, string(res), 403)
		return
	}
	min := r.FormValue("min")
	t, err := template.ParseFiles("templates/layout.html")
	if err != nil {
		res, _ := json.Marshal(map[string]string{"error": err.Error()})
		http.Error(w, string(res), 500)
		return
	}
	p := Page{}
	if util.Config("static.min") == "true" && min != "0" {
		p = Page{
			JSLIB:   hash_version(tjs),
			JSASYNC: hash_version(jsasync),
			JSAPP:   []string{"/min.js?v=" + js_min_version(jsapp)},
			JSINIT:  []string{},
			CSS:     []string{"/min.css?v=" + css_min_version()},
			DEBUG:   util.Config("debug") == "true",
		}
	} else {
		p = Page{
			JSLIB:   hash_version(tjs),
			JSASYNC: hash_version(jsasync),
			JSAPP:   hash_version(jsapp),
			JSINIT:  append([]string{"/init.js?v=" + jsinit_version()}, hash_version(tests)...),
			CSS:     hash_version(tcss),
			DEBUG:   util.Config("debug") == "true",
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

	err = t.Execute(w, p)
	if err != nil {
		log.Println("TEMPLATE ERROR - " + err.Error())
	}
}
