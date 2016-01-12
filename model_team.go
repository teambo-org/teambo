package main

import (
	// "time"
	"bytes"
	"fmt"
	"github.com/boltdb/bolt"
	// "errors"
)

type Team struct {
	Hash       string `json:"hash"`
	Akey       string `json:"akey"`
	Ciphertext string `json:"ct"`
}

func team_save(hash string, akey string, ct string) (item Team, err error) {
	db_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("team"))

		err := b.Put([]byte(hash+akey), []byte(ct))
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		fmt.Println(err)
		return item, err
	}

	item = Team{hash, akey, ct}
	return item, nil
}

func team_find(hash string, akey string) (item Team, err error) {
	ct := ""
	db_view(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("team"))

		v := b.Get([]byte(hash + akey))
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
		item = Team{hash, akey, ct}
		return item, nil
	}
	return item, nil
}

func team_exists(hash string) (exists bool, err error) {
	exists = false
	db_view(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("team")).Cursor()

		prefix := []byte(hash)
		for k, v := b.Seek(prefix); bytes.HasPrefix(k, prefix); k, v = b.Next() {
			exists = string(v) != "new"
		}
		return nil
	})
	if err != nil {
		fmt.Println(err)
		return false, err
	}

	return exists, nil
}
