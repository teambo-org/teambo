package main

import (
	"bytes"
	"fmt"
	"github.com/boltdb/bolt"
	// "errors"
)

type TeamMember struct {
	Mkey       string `json:"mkey"`
	Ciphertext string `json:"ct"`
}

func team_member_save(team_id string, mkey string, ct string) (item TeamMember, err error) {
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte("member"))
		err = b.Put([]byte(mkey), []byte(ct))
		if err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		fmt.Println(err)
		return item, err
	}
	item = TeamMember{mkey, ct}
	return item, nil
}

func team_member_find(team_id string, mkey string) (item TeamMember, err error) {
	ct := ""
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte("member"))
		if err != nil {
			return err
		}
		c := b.Cursor()
		prefix := []byte(mkey)
		for k, v := c.Seek(prefix); bytes.HasPrefix(k, prefix); k, _ = c.Next() {
			ct = string(v)
		}
		return nil
	})
	if err != nil {
		fmt.Println(err)
		return item, err
	}
	if ct != "" {
		item = TeamMember{mkey, ct}
		return item, nil
	}
	return item, nil
}

func team_member_exists(team_id string, mkey string) (exists bool, err error) {
	exists = false
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, _ := tx.CreateBucketIfNotExists([]byte("member"))
		c := b.Cursor()

		prefix := []byte(mkey)
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

func team_member_remove(team_id string, mkey string) (err error) {
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte("member"))
		err = b.Delete([]byte(mkey))
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
