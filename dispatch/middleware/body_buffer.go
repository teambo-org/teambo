package middleware

import (
	"net/http"
	"bytes"
	"io/ioutil"
)

func BodyBuffer(next func(w http.ResponseWriter, r *http.Request)) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		// Atvaark: You could try wrapping the r.Body reader with your own one that also calculates the hash when reading.
		body, _ := ioutil.ReadAll(r.Body)
		r.Body = ioutil.NopCloser(bytes.NewReader(body))
		r.ParseForm()
		r.Body = ioutil.NopCloser(bytes.NewReader(body))
		// b := bytes.Buffer{}
		// b.ReadFrom(r.Body)
		// r.Body = ioutil.NopCloser(bytes.NewReader(b))
		next(w, r)
	}
}
