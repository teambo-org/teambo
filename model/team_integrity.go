package model

import (
	"github.com/boltdb/bolt"
	"time"
	"crypto/sha256"
	"encoding/base64"
	"strings"
	"sync"
	// "log"
)

type teamIntegrity struct {
	TeamId  string
	Buckets []string
	Ivs     []string
	TTL     int64
	Expires int64
	Cache   string
	bucket_names map[string]bool
	mutex   *sync.Mutex
}

func (ti *teamIntegrity) Init() (err error) {
	ti.mutex = &sync.Mutex{}
	ti.mutex.Lock()
	ti.bucket_names = map[string]bool{}
	err = db_team_view(ti.TeamId, func(tx *bolt.Tx) error {
		for _, bucket_name := range ti.Buckets {
			ti.bucket_names[bucket_name] = true
			b := tx.Bucket([]byte(bucket_name))
			if b == nil {
				continue;
			}
			b.ForEach(func(k, ct []byte) error {
				parts := strings.Split(string(ct), " ")
				iv := parts[0]
				if iv == "new" {
					return nil
				}
				ti.Ivs = append(ti.Ivs, bucket_name + "-" + string(k) + "-" + iv)
				return nil
			})
		}
		return nil
	})
	ti.mutex.Unlock()
	if err != nil {
		return err
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
	if ti.Cache != "" {
		ti.mutex.Unlock()
		return ti.Cache
	}
	hasher := sha256.New()
	for _, k := range ti.Ivs {
		hasher.Write([]byte(k))
	}
	ti.Cache = base64.StdEncoding.EncodeToString(hasher.Sum(nil))
	ti.mutex.Unlock()
	ti.Expires = time.Now().UnixNano() + ti.TTL
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
	for i, k := range ti.Ivs {
		if strings.HasPrefix(k, id) {
			// replace
			ti.Ivs = append(ti.Ivs[:i], append([]string{new_k}, ti.Ivs[i+1:]...)...)
			break
		} else if(k > id) {
			// insert
			ti.Ivs = append(ti.Ivs[:i], append([]string{new_k}, ti.Ivs[i:]...)...)
			break
		}
	}
	ti.Cache = ""
	ti.mutex.Unlock()
	ti.ExpirationReset()
	return
}

func (ti *teamIntegrity) Remove(model string, key string) {
	if _, ok := ti.bucket_names[model]; !ok {
		return
	}
	id := model + "-" + key
	ti.mutex.Lock()
	for i, k := range ti.Ivs {
		if strings.HasPrefix(k, id) {
			// remove
			ti.Ivs = append(ti.Ivs[:i], ti.Ivs[i+1:]...)
			break
		} else if(k > id) {
			// early exit if not found
			break
		}
	}
	ti.Cache = ""
	ti.mutex.Unlock()
	ti.ExpirationReset()
	return
}

func (ti *teamIntegrity) DiffLog(ivs []string) []map[string]interface{} {
	local_iv_map  := map[string]bool{}
	remote_iv_map := map[string]bool{}
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
				"type": "log",
				"model": parts[0],
				"id": parts[1],
				"iv": parts[2],
				"ts": time.Now().UTC().UnixNano()/int64(time.Millisecond),
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
				"type": "log",
				"model": parts[0],
				"id": parts[1],
				"iv": "removed",
				"ts": time.Now().UTC().UnixNano()/int64(time.Millisecond),
			})
		}
	}
	return log
}
