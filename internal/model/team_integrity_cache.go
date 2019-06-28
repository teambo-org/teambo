package model

import (
	"sort"
	"time"
	// "log"
)

type teamIntegrityCache struct {
	Teams   map[string]*teamIntegrity
	Buckets []string
	TTL     int64
}

var TeamIntegrityCache = teamIntegrityCache{
	Teams:   map[string]*teamIntegrity{},
	Buckets: []string{},
	TTL:     6 * 60 * 60,
}

func (tic *teamIntegrityCache) Init(buckets []string) {
	sort.Strings(buckets)
	tic.Buckets = buckets
	ticker := time.NewTicker(10 * time.Minute)
	go func() {
		for _ = range ticker.C {
			tic.PurgeExpired()
		}
	}()
	return
}

func (tic *teamIntegrityCache) AddBucket(bucket string) {
	tic.Buckets = append(tic.Buckets, bucket)
	sort.Strings(tic.Buckets)
}

func (tic *teamIntegrityCache) PurgeExpired() {
	now := time.Now().Unix()
	for id, team := range tic.Teams {
		if team.Expires < now {
			delete(tic.Teams, id)
		}
	}
}

func (tic *teamIntegrityCache) Find(team_id string) (ti *teamIntegrity, err error) {
	if _, ok := tic.Teams[team_id]; !ok {
		new_ti := teamIntegrity{
			TeamId:  team_id,
			Buckets: tic.Buckets,
			TTL:     tic.TTL,
		}
		err = new_ti.Init()
		if err != nil {
			return ti, err
		}
		tic.Teams[team_id] = &new_ti
	}
	return tic.Teams[team_id], nil
}
