package model

import (
	"sort"
	// "log"
)

type teamIntegrityCache struct {
	Teams   map[string]*teamIntegrity
	Buckets []string
	TTL     int64
}

var TeamIntegrityCache = teamIntegrityCache {
	Teams:   map[string]*teamIntegrity{},
	Buckets: []string{},
	TTL:     72 * 60 * 60,
}

func (tic *teamIntegrityCache) Init(buckets []string) {
	sort.Strings(buckets)
	tic.Buckets = buckets
	return
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
