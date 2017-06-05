package controller

import (
	"net/http"
	"time"
	"sync"
	"log"
)

type cacheItem struct {
	Body []byte
	Mimetype string
	Modified time.Time
}

type httpCache struct {
	cache map[string]*cacheItem
	mutex *sync.RWMutex
}

var HttpCache = httpCache {
	cache: map[string]*cacheItem{},
	mutex: &sync.RWMutex{},
}

func (hc *httpCache) Clear() {
	hc.cache = map[string]*cacheItem{}
}

func (hc *httpCache) Serve(w http.ResponseWriter, r *http.Request) bool {
	hc.mutex.RLock()
	defer hc.mutex.RUnlock()
	if item, ok := hc.cache[r.URL.Path]; ok {
		modHdr := r.Header.Get("If-Modified-Since")
		modHdrTime, _ := time.Parse(time.RFC1123, modHdr)
		if modHdr != "" && item.Modified.Unix() <= modHdrTime.Unix() {
			w.WriteHeader(304)
			return true
		}
		w.Header().Set("Last-Modified", item.Modified.Format(time.RFC1123))
		w.Header().Set("Content-Type", item.Mimetype)
		w.Write(item.Body)
		return true
	}
	return false
}

func (hc *httpCache) Set(url string, item cacheItem) {
	hc.mutex.Lock()
	defer hc.mutex.Unlock()
	log.Println("Setting Cache Item: " + url)
	hc.cache[url] = &item
}
