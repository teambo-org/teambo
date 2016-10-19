package model

import (
	// "time"
	"bytes"
	"fmt"
	"github.com/boltdb/bolt"
	// "errors"
)

type Acct struct {
	Id         string `json:"id"`
	Akey       string `json:"akey"`
	Ciphertext string `json:"ct"`
}

func CreateAcct(id string, akey string, ct string) (item Acct, err error) {
	db_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("acct"))

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

	item = Acct{id, akey, ct}
	return item, nil
}

func FindAcct(id string, akey string) (item Acct, err error) {
	ct := ""
	db_view(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("acct"))

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
		item = Acct{id, akey, ct}
		return item, nil
	}
	return item, nil
}

func AcctExists(id string) (exists bool, err error) {
	exists = false
	db_view(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("acct")).Cursor()

		prefix := []byte(id)
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
