package main

import (
	"bytes"
	"fmt"
	"github.com/boltdb/bolt"
	// "errors"
)

type TeamItem struct {
	Id         string `json:"id"`
	BucketId   string `json:"bucket_id"`
	Ciphertext string `json:"ct"`
}

func team_item_save(team_id string, bucket_id string, id string, ct string) (item TeamItem, err error) {
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte(bucket_id))

		err = b.Put([]byte(id), []byte(ct))
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		fmt.Println(err)
		return item, err
	}

	item = TeamItem{id, bucket_id, ct}
	return item, nil
}

func team_item_find(team_id string, bucket_id string, id string) (item TeamItem, err error) {
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

func team_item_exists(team_id string, bucket_id string, id string) (exists bool, err error) {
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

func team_item_remove(team_id string, bucket_id string, id string) (err error) {
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte(bucket_id))

		err = b.Delete([]byte(id))
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
