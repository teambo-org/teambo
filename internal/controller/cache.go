package controller

import (
	"bytes"
	"compress/gzip"
	"log"
	"net/http"
	"sync"
	"time"
)

type CacheItem struct {
	Body     []byte
	Mimetype string
	Modified time.Time
}

type httpCache struct {
	cache   map[string]*CacheItem
	gzcache map[string]*CacheItem
	mutex   *sync.RWMutex
}

var HttpCache = httpCache{
	cache:   map[string]*CacheItem{},
	gzcache: map[string]*CacheItem{},
	mutex:   &sync.RWMutex{},
}

func (hc *httpCache) Clear() {
	hc.cache = map[string]*CacheItem{}
	hc.gzcache = map[string]*CacheItem{}
}

func (hc *httpCache) Serve(w http.ResponseWriter, r *http.Request) bool {
	hc.mutex.RLock()
	defer hc.mutex.RUnlock()
	item, ok := &CacheItem{}, false
	if r.Context().Value("gzip").(bool) {
		item, ok = hc.gzcache[r.URL.Path]
	} else {
		item, ok = hc.cache[r.URL.Path]
	}
	if !ok {
		return false
	}
	modHdr := r.Header.Get("If-Modified-Since")
	modHdrTime, _ := time.Parse(time.RFC1123, modHdr)
	if modHdr != "" && item.Modified.Unix() <= modHdrTime.Unix() {
		w.WriteHeader(304)
		return true
	}
	w.Header().Set("Last-Modified", item.Modified.Format(time.RFC1123))
	w.Header().Set("Content-Type", item.Mimetype)
	w.Header().Set("Teambo-From-Cache", "1")
	w.Write(item.Body)
	return true
}

func (hc *httpCache) Set(r *http.Request, item CacheItem) {
	hc.mutex.Lock()
	defer hc.mutex.Unlock()
	if r.Context().Value("gzip").(bool) {
		log.Println("Setting Cache Item (gzip): " + r.URL.Path)
		b := &bytes.Buffer{}
		gz := gzip.NewWriter(b)
		gz.Write(item.Body)
		gz.Close()
		item.Body = b.Bytes()
		hc.gzcache[r.URL.Path] = &item
	} else {
		log.Println("Setting Cache Item: " + r.URL.Path)
		hc.cache[r.URL.Path] = &item
	}
}
