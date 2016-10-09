package main

import (
	"bytes"
	"fmt"
	"github.com/boltdb/bolt"
	// "errors"
)

type TeamBucket struct {
	Id         string `json:"id"`
	Ciphertext string `json:"ct"`
}

func team_bucket_save(team_id string, id string, ct string) (item TeamBucket, err error) {
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte("bucket"))

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

	item = TeamBucket{id, ct}
	return item, nil
}

func team_bucket_find(team_id string, id string) (item TeamBucket, err error) {
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

func team_bucket_exists(team_id string, id string) (exists bool, err error) {
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

func team_bucket_remove(team_id string, id string) (err error) {
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte("bucket"))

		err = b.Delete([]byte(id))
		if err != nil {
			return err
		}

		err = tx.DeleteBucket([]byte(id))

		return nil
	})
	if err != nil {
		fmt.Println(err)
		return err
	}
	return nil
}
