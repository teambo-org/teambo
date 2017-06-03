package model

import (
	"fmt"
	"time"
	// "log"
)

type TeamObject struct {
	TeamId     string `json:"-"`
	Bucket     string `json:"-"`
	Id         string `json:"id"`
	Ciphertext string `json:"ct"`
}

func (o TeamObject) Save() (err error) {
	team_db, err := TeamDBCache.Find(o.TeamId)
	if err != nil {
		return err
	}
	err = team_db.Put(o.Bucket + "-" + o.Id, o.Ciphertext)
	if err == nil && o.Ciphertext != "new" {
		integrity, err := TeamIntegrityCache.Find(o.TeamId)
		if err == nil {
			integrity.Insert(o.Bucket, o.Id, o.Ciphertext)
		}
	}
	return err
}

func (o TeamObject) Remove() (err error) {
	team_db, err := TeamDBCache.Find(o.TeamId)
	if err != nil {
		return err
	}
	err = team_db.Delete(o.Bucket + "-" + o.Id)
	if err == nil && o.Ciphertext != "new" {
		integrity, err := TeamIntegrityCache.Find(o.TeamId)
		if err == nil {
			integrity.Remove(o.Bucket, o.Id)
		}
	}
	return err
}

func (o TeamObject) Log(iv string) (log string, err error) {
	team_db, err := TeamDBCache.Find(o.TeamId)
	if err != nil {
		return log, err
	}
	ts := time.Now().UnixNano()
	k := fmt.Sprintf("log-%d-%s-%s", ts, o.Bucket, o.Id)
	log = k + "-" + iv
	err = team_db.Put(k, iv)
	return log, err
}
