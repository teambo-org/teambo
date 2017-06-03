package model

import (
	"./driver"
	"time"
	// "log"
)

type teamDBCache struct {
	TeamDBs  map[string]driver.DB
	Expires  map[string]int64
	TTL      time.Duration
}

var TeamDBCache = teamDBCache{
	TeamDBs: map[string]driver.DB{},
	Expires: map[string]int64{},
	TTL:     1 * time.Hour,
}

func (tdbc *teamDBCache) Init() {
	ticker := time.NewTicker(5 * time.Minute)
	go func() {
		for _ = range ticker.C {
			tdbc.PurgeExpired()
		}
	}()
	return
}

func (tdbc *teamDBCache) PurgeExpired() {
	now := time.Now().Unix()
	for team_id, expires := range tdbc.Expires {
		if expires < now {
			if db, ok := tdbc.TeamDBs[team_id]; ok {
				db.Close()
			}
			delete(tdbc.TeamDBs, team_id)
			delete(tdbc.Expires, team_id)
		}
	}
}

func (tdbc *teamDBCache) Expire(team_id string) {
	if db, ok := tdbc.TeamDBs[team_id]; ok {
		db.Close()
	}
	delete(tdbc.TeamDBs, team_id)
	delete(tdbc.Expires, team_id)
}

func (tdbc *teamDBCache) CloseAll() {
	for team_id, db := range tdbc.TeamDBs {
		db.Close()
		delete(tdbc.TeamDBs, team_id)
		delete(tdbc.Expires, team_id)
	}
}

func (tdbc *teamDBCache) Find(team_id string) (d driver.DB, err error) {
	if _, ok := tdbc.TeamDBs[team_id]; !ok {
		dbh, err := db_team_open(team_id)
		if err != nil {
			return d, err
		}
		tdbc.TeamDBs[team_id] = dbh
	}
	tdbc.Expires[team_id] = time.Now().Add(tdbc.TTL).Unix()
	return tdbc.TeamDBs[team_id], nil
}
