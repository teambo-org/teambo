package model

import (
	"bytes"
	"fmt"
	"github.com/boltdb/bolt"
	"../util"
	// "errors"
)

type TeamItem struct {
	Id         string `json:"id"`
	BucketId   string `json:"bucket_id"`
	Ciphertext string `json:"ct"`
}

func (ti TeamItem) Save (team_id string) (err error) {
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte(ti.BucketId))

		err = b.Put([]byte(ti.Id), []byte(ti.Ciphertext))
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

func (ti TeamItem) Remove (team_id string) (err error) {
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte(ti.BucketId))

		err = b.Delete([]byte(ti.Id))
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

func NewTeamItem (team_id string, bucket_id string) TeamItem {
	id := util.RandStr(8)
	for {
		exists, _ := TeamItemExists(team_id, bucket_id, id)
		if exists {
			id = util.RandStr(8)
		} else {
			break;
		}
	}
	return TeamItem{id, bucket_id, "new"}
}

func FindTeamItem (team_id string, bucket_id string, id string) (item TeamItem, err error) {
	ct := ""
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte(bucket_id))

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
		item = TeamItem{id, bucket_id, ct}
		return item, nil
	}
	return item, nil
}

func TeamItemExists (team_id string, bucket_id string, id string) (exists bool, err error) {
	exists = false
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, _ := tx.CreateBucketIfNotExists([]byte(bucket_id))
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
