package middleware

import (
	"net/http"
	"compress/gzip"
	"io"
)

type gzipResponseWriter struct {
	io.Writer
	http.ResponseWriter
}
func (w gzipResponseWriter) Write(b []byte) (int, error) {
	return w.Writer.Write(b)
}

func Gzip(next func(w http.ResponseWriter, r *http.Request)) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Context().Value("gzip").(bool) {
			gz := gzip.NewWriter(w)
			defer gz.Close()
			gzw := gzipResponseWriter{Writer: gz, ResponseWriter: w}
			next(gzw, r)
		} else {
			next(w, r)
		}
	}
}
