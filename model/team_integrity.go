package model

import (
	"crypto/sha256"
	"encoding/base64"
	"strings"
	"sync"
	"time"
	// "log"
)

type teamIntegrity struct {
	TeamId       string
	Buckets      []string
	Ivs          []string
	TTL          int64
	Expires      int64
	Cache        string
	bucket_names map[string]bool
	mutex        *sync.Mutex
}

func (ti *teamIntegrity) Init() (err error) {
	ti.mutex = &sync.Mutex{}
	ti.mutex.Lock()
	defer ti.mutex.Unlock()
	ti.bucket_names = map[string]bool{}
	team_db, err := TeamDBPool.Find(ti.TeamId)
	if err != nil {
		return err
	}
	for _, bucket_name := range ti.Buckets {
		ti.bucket_names[bucket_name] = true
		prefix := bucket_name + "-"
		iter := team_db.PrefixIterator(prefix)
		for iter.Next() {
			parts := strings.Split(iter.Value(), " ")
			iv := parts[0]
			if iv == "new" {
				continue
			}
			ti.Ivs = append(ti.Ivs, iter.Key() + "-" + iv)
		}
		iter.Release()
	}
	ti.ExpirationReset()
	return nil
}

func (ti *teamIntegrity) ExpirationReset() {
	ti.Expires = time.Now().Unix() + ti.TTL
	return
}

func (ti *teamIntegrity) Hash() string {
	ti.mutex.Lock()
	defer ti.mutex.Unlock()
	if ti.Cache != "" {
		ti.ExpirationReset()
		return ti.Cache
	}
	hasher := sha256.New()
	for _, k := range ti.Ivs {
		hasher.Write([]byte(k))
	}
	ti.Cache = base64.StdEncoding.EncodeToString(hasher.Sum(nil))
	ti.ExpirationReset()
	return ti.Cache
}

func (ti *teamIntegrity) Insert(model string, key string, ct string) {
	if _, ok := ti.bucket_names[model]; !ok {
		return
	}
	parts := strings.Fields(ct)
	iv := parts[0]
	id := model + "-" + key
	new_k := id + "-" + iv
	ti.mutex.Lock()
	defer ti.mutex.Unlock()
	var orig_len = len(ti.Ivs)
	for i, k := range ti.Ivs {
		if strings.HasPrefix(k, id) {
			// replace
			ti.Ivs = append(ti.Ivs[:i], append([]string{new_k}, ti.Ivs[i+1:]...)...)
			break
		} else if k > id {
			// insert
			ti.Ivs = append(ti.Ivs[:i], append([]string{new_k}, ti.Ivs[i:]...)...)
			break
		}
	}
	if orig_len == len(ti.Ivs) {
		ti.Ivs = append(ti.Ivs, new_k)
	}
	ti.Cache = ""
	ti.ExpirationReset()
	return
}

func (ti *teamIntegrity) Remove(model string, key string) {
	if _, ok := ti.bucket_names[model]; !ok {
		return
	}
	id := model + "-" + key
	ti.mutex.Lock()
	defer ti.mutex.Unlock()
	for i, k := range ti.Ivs {
		if strings.HasPrefix(k, id) {
			// remove
			ti.Ivs = append(ti.Ivs[:i], ti.Ivs[i+1:]...)
			break
		} else if k > id {
			// early exit if not found
			break
		}
	}
	ti.Cache = ""
	ti.ExpirationReset()
	return
}

func (ti *teamIntegrity) DiffLog(ivs []string) []map[string]interface{} {
	local_iv_map := map[string]bool{}
	remote_iv_map := map[string]bool{}
	ti.mutex.Lock()
	defer ti.mutex.Unlock()
	for _, iv := range ivs {
		remote_iv_map[iv] = true
	}
	for _, iv := range ti.Ivs {
		parts := strings.Split(iv, "-")
		model_id := parts[0] + "-" + parts[1]
		local_iv_map[model_id] = true
	}
	log := []map[string]interface{}{}
	// update everything server has that client doesn't
	for _, iv := range ti.Ivs {
		if _, ok := remote_iv_map[iv]; !ok {
			parts := strings.Split(iv, "-")
			log = append(log, map[string]interface{}{
				"channel_id": ti.TeamId,
				"type":       "log",
				"model":      parts[0],
				"id":         parts[1],
				"iv":         parts[2],
				"ts":         time.Now().UTC().UnixNano() / int64(time.Millisecond),
			})
		}
	}
	// remove everything client has but server doesn't
	for _, iv := range ivs {
		parts := strings.Split(iv, "-")
		model_id := parts[0] + "-" + parts[1]
		if _, ok := local_iv_map[model_id]; !ok {
			log = append(log, map[string]interface{}{
				"channel_id": ti.TeamId,
				"type":       "log",
				"model":      parts[0],
				"id":         parts[1],
				"iv":         "removed",
				"ts":         time.Now().UTC().UnixNano() / int64(time.Millisecond),
			})
		}
	}
	return log
}
