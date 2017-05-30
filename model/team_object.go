package model

import (
	"fmt"
	"github.com/boltdb/bolt"
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
	db_team_update(o.TeamId, func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte(o.Bucket))
		err = b.Put([]byte(o.Id), []byte(o.Ciphertext))
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		fmt.Println(err)
		return err
	}
	if o.Ciphertext != "new" {
		integrity, err := TeamIntegrityCache.Find(o.TeamId)
		if err == nil {
			integrity.Insert(o.Bucket, o.Id, o.Ciphertext)
		}
	}
	return nil
}

func (o TeamObject) Remove() (err error) {
	db_team_update(o.TeamId, func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte(o.Bucket))

		err = b.Delete([]byte(o.Id))
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		fmt.Println(err)
		return err
	}
	if o.Ciphertext != "new" {
		integrity, err := TeamIntegrityCache.Find(o.TeamId)
		if err == nil {
			integrity.Remove(o.Bucket, o.Id)
		}
	}
	return nil
}

func (o TeamObject) Log(iv string) (log string, err error) {
	db_team_update(o.TeamId, func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte("log"))
		ts := time.Now().UnixNano()
		k := fmt.Sprintf("%d-%s-%s", ts, o.Bucket, o.Id)
		err = b.Put([]byte(k), []byte(iv))
		if err != nil {
			return err
		}
		log = k + "-" + iv

		return nil
	})
	if err != nil {
		fmt.Println(err)
		return log, err
	}
	return log, nil
}
