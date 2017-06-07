package model

import (
	"./driver"
	"time"
	"sync"
	"log"
)

type teamDBPool struct {
	Pool     map[string]driver.DB
	Expires  map[string]int64
	TTL      time.Duration
	mutex    *sync.RWMutex
}

var TeamDBPool = teamDBPool{
	Pool:    map[string]driver.DB{},
	Expires: map[string]int64{},
	TTL:     1 * time.Hour,
	mutex:   &sync.RWMutex{},
}

func (tdbc *teamDBPool) Init() {
	ticker := time.NewTicker(5 * time.Minute)
	go func() {
		for _ = range ticker.C {
			tdbc.PurgeExpired()
		}
	}()
	return
}

func (tdbc *teamDBPool) Find(team_id string) (d driver.DB, err error) {
	tdbc.mutex.Lock()
	defer tdbc.mutex.Unlock()
	d, ok := tdbc.Pool[team_id]
	if ok {
		tdbc.Expires[team_id] = time.Now().Add(tdbc.TTL).Unix()
		return d, nil
	}
	d, err = db_team_open(team_id)
	if err == nil {
		tdbc.Pool[team_id] = d
		tdbc.Expires[team_id] = time.Now().Add(tdbc.TTL).Unix()
	} else {
		log.Println(err)
	}
	return d, err
}

func (tdbc *teamDBPool) PurgeExpired() {
	now := time.Now().Unix()
	tdbc.mutex.Lock()
	defer tdbc.mutex.Unlock()
	for team_id, expires := range tdbc.Expires {
		if expires < now {
			if db, ok := tdbc.Pool[team_id]; ok {
				db.Close()
			}
			delete(tdbc.Pool, team_id)
			delete(tdbc.Expires, team_id)
		}
	}
}

func (tdbc *teamDBPool) Expire(team_id string) {
	tdbc.mutex.Lock()
	defer tdbc.mutex.Unlock()
	if db, ok := tdbc.Pool[team_id]; ok {
		db.Close()
	}
	delete(tdbc.Pool, team_id)
	delete(tdbc.Expires, team_id)
}

func (tdbc *teamDBPool) CloseAll() {
	tdbc.mutex.Lock()
	defer tdbc.mutex.Unlock()
	for team_id, db := range tdbc.Pool {
		db.Close()
		delete(tdbc.Pool, team_id)
		delete(tdbc.Expires, team_id)
	}
}
