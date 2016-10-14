package model

import (
	"bytes"
	"fmt"
	"github.com/boltdb/bolt"
	"../util"
	// "errors"
)

type TeamBucket struct {
	Id         string `json:"id"`
	Ciphertext string `json:"ct"`
}

func (tb TeamBucket) Save (team_id string) (err error) {
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte("bucket"))

		err = b.Put([]byte(tb.Id), []byte(tb.Ciphertext))
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		fmt.Println(err)
		return err
	}

	return nil
}

func (tb TeamBucket) Remove (team_id string) (err error) {
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte("bucket"))

		err = b.Delete([]byte(tb.Id))
		if err != nil {
			return err
		}

		err = tx.DeleteBucket([]byte(tb.Id))

		return nil
	})
	if err != nil {
		fmt.Println(err)
		return err
	}
	return nil
}

func NewTeamBucket (team_id string) TeamBucket {
	id := util.RandStr(8)
	for {
		exists, _ := TeamBucketExists(team_id, id)
		if exists {
			id = util.RandStr(8)
		} else {
			break;
		}
	}
	return TeamBucket{id, "new"}
}

func FindTeamBucket (team_id string, id string) (item TeamBucket, err error) {
	ct := ""
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte("bucket"))

		v := b.Get([]byte(id))
		if err != nil {
			return err
		}

		ct = string(v)

		return nil
	})
	if err != nil {
		fmt.Println(err)
		return item, err
	}

	if ct != "" {
		item = TeamBucket{id, ct}
		return item, nil
	}
	return item, nil
}

func TeamBucketExists (team_id string, id string) (exists bool, err error) {
	exists = false
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, _ := tx.CreateBucketIfNotExists([]byte("bucket"))
		c := b.Cursor()

		prefix := []byte(id)
		for k, _ := c.Seek(prefix); bytes.HasPrefix(k, prefix); k, _ = c.Next() {
			exists = true
		}
		return nil
	})
	if err != nil {
		fmt.Println(err)
		return false, err
	}

	return exists, nil
}
