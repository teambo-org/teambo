package main

import (
	// "time"
	"bytes"
	"fmt"
	"github.com/boltdb/bolt"
	// "errors"
)

type Team struct {
	Id         string `json:"id"`
	Akey       string `json:"akey"`
	Ciphertext string `json:"ct"`
}

func team_save(id string, akey string, ct string) (item Team, err error) {
	db_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("team"))

		err := b.Put([]byte(id+akey), []byte(ct))
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		fmt.Println(err)
		return item, err
	}

	item = Team{id, akey, ct}
	return item, nil
}

func team_find(id string, akey string) (item Team, err error) {
	ct := ""
	db_view(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("team"))

		v := b.Get([]byte(id + akey))
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
		item = Team{id, akey, ct}
		return item, nil
	}
	return item, nil
}

func team_exists(id string) (exists bool, err error) {
	exists = false
	db_view(func(tx *bolt.Tx) error {
		c := tx.Bucket([]byte("team")).Cursor()

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
