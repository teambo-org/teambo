package main

import (
	"encoding/json"
	"html/template"
	"log"
	"net/http"
	// "fmt"
)

var tjs = append(js, []string{
	"/js/lib/jasmine.2.5.js",
	"/js/lib/jasmine-html.2.5.js",
}...)
var tcss = append(css, []string{
	"/css/lib/jasmine.2.5.css",
}...)
var tests = []string{
	"/js/test/boot.js",
	"/js/test/t.test.js",
	"/js/test/t.acct.test.js",
}

func handle_test(w http.ResponseWriter, r *http.Request) {
	min := r.FormValue("min")
	t, err := template.ParseFiles("templates/test.html")
	if err != nil {
		res, _ := json.Marshal(map[string]string{"error": err.Error()})
		http.Error(w, string(res), 500)
		return
	}
	manifest := []string{}
	if config["app.manifest"] == "true" {
		manifest = []string{
			"/test.manifest",
		}
	}
	p := Page{}
	if config["static.min"] == "true" && min != "0" {
		p = Page{
			JS:       []string{"/min.js?v=" + js_min_version()},
			JSINIT:   []string{},
			CSS:      []string{"/min.css?v=" + css_min_version()},
			DEBUG:    config["debug"] == "true",
			MANIFEST: manifest,
		}
	} else {
		p = Page{
			JS:       hash_version(tjs),
			JSINIT:   append([]string{"/init.js?v=" + jsinit_version()}, tests...),
			CSS:      hash_version(tcss),
			DEBUG:    config["debug"] == "true",
			MANIFEST: manifest,
		}
	}

	w.Header().Set("X-Frame-Options", "DENY")
	w.Header().Set("X-XSS-Protection", "1; mode=block")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("X-Permitted-Cross-Domain-Policies", "none")
	w.Header().Set("Content-Security-Policy", "default-src 'self'; style-src 'self' data:; img-src 'self' data:; font-src 'self' data:; connect-src 'self' blob:")
	if config["ssl.active"] == "true" {
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
	}

	if config["static.cache"] == "true" {
		// w.Header().Set("X-Cache-Edge", "0")
		w.Header().Set("Expires", "Mon, 28 Jan 2038 23:30:00 GMT")
		w.Header().Set("Cache-Control", "max-age=315360000")
	}

	err = t.Execute(w, p)
	if err != nil {
		log.Println("TEMPLATE ERROR - " + err.Error())
	}
}

func handle_test_manifest(w http.ResponseWriter, r *http.Request) {
	t, err := template.ParseFiles("templates/app.manifest")
	if err != nil {
		res, _ := json.Marshal(map[string]string{"error": err.Error()})
		http.Error(w, string(res), 500)
		return
	}
	p := Page{}
	if config["static.min"] == "true" {
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
			JS:     hash_version(tjs),
			JSINIT: append([]string{"/init.js?v=" + jsinit_version()}, tests...),
			CSS:    hash_version(tcss),
			AUDIO:  find_audio(),
			IMAGE:  find_images(),
			FONT:   find_fonts(),
		}
	}
	err = t.Execute(w, p)
	if err != nil {
		log.Println("TEMPLATE ERROR - " + err.Error())
	}
}
