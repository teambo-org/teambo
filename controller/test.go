package controller

import (
	"../util"
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
	"/js/test/t.team.test.js",
	"/js/test/t.team.bucket.test.js",
	"/js/test/t.team.item.test.js",
}

func Test(w http.ResponseWriter, r *http.Request) {
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
			JS:     []string{"/min.js?v=" + js_min_version()},
			JSINIT: []string{},
			CSS:    []string{"/min.css?v=" + css_min_version()},
			DEBUG:  util.Config("debug") == "true",
		}
	} else {
		p = Page{
			JS:     hash_version(tjs),
			JSINIT: append([]string{"/init.js?v=" + jsinit_version()}, hash_version(tests)...),
			CSS:    hash_version(tcss),
			DEBUG:  util.Config("debug") == "true",
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

	err = t.Execute(w, p)
	if err != nil {
		log.Println("TEMPLATE ERROR - " + err.Error())
	}
}
