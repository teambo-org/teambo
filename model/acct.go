package model

import (
	// "time"
	// "bytes"
	"fmt"
	"github.com/boltdb/bolt"
	// "errors"
)

type Acct struct {
	Akey       string `json:"akey"`
	Ciphertext string `json:"ct"`
}

func CreateAcct(akey string, ct string) (item Acct, err error) {
	db_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("acct"))

		err := b.Put([]byte(akey), []byte(ct))
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		fmt.Println(err)
		return item, err
	}

	item = Acct{akey, ct}
	return item, nil
}

func FindAcct(akey string) (item Acct, err error) {
	ct := ""
	db_view(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("acct"))

		v := b.Get([]byte(akey))

		ct = string(v)

		return nil
	})
	if err != nil {
		fmt.Println(err)
		return item, err
	}

	if ct != "" {
		item = Acct{akey, ct}
		return item, nil
	}
	return item, nil
}
