package main

import (
    "net/http"
    // "fmt"
	// "log"
    "flag"
	"golang.org/x/net/http2"
	"fmt"
	// "errors"
    "github.com/boltdb/bolt"
)

type Response map[string]interface{}

var (
    config map[string]string
)

var config_path *string = flag.String("conf", "app.conf", "Location of config file")
var config_version *string = flag.String("v", "12345", "Version")

type StaticHandler struct{}
func (h StaticHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Cache-Control", "max-age=0, must-revalidate")
    switch r.URL.Path {
        case "/":                  handle_index(w, r)
        case "/acct":              handle_acct(w, r)
        case "/acct/auth":         handle_acct_auth(w, r)
        case "/acct/verification": handle_acct_verification(w, r)
        case "/slow":              handle_slow(w, r)
        case "/app.manifest":      handle_manifest(w, r)
        case "/init.js":       	   handle_init(w, r)
        default:                   handle_static(w, r)
    }
}

func main() {
    flag.Parse()
    config = parseConfig(*config_path)
    
    db_update(func(tx *bolt.Tx) error { 
		tx.CreateBucketIfNotExists([]byte("acct"))
		tx.CreateBucketIfNotExists([]byte("verification"))
        return nil
    })
    
    http.Handle("/", StaticHandler{})
    
	if config["ssl.active"] == "true" {
		srv := &http.Server{
			Addr:    ":443",
		}
		err := http2.ConfigureServer(srv, &http2.Server{})
		if err != nil { fmt.Println("ERROR - " + err.Error()) }
	} else {
		err := http.ListenAndServe(":80", nil)
		if err != nil { fmt.Println("ERROR - " + err.Error()) }
	}
}
