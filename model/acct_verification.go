package model

import (
	"bytes"
	"fmt"
	"github.com/boltdb/bolt"
	"time"
)

type AcctVerification struct {
	Id   string `json:"id"`
	Akey string `json:"akey"`
	Vkey string `json:"vkey"`
	Date string `json:"date"`
}

func (av *AcctVerification) Delete () (err error) {
	db_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("verification"))
		c := b.Cursor()

		prefix := []byte(av.Id + av.Akey)
		for k, _ := c.Seek(prefix); bytes.HasPrefix(k, prefix); k, _ = c.Next() {
			b.Delete(k)
		}
		return nil
	})
	if err != nil {
		fmt.Println(err)
		return err
	}

	return nil
}

func CreateAcctVerification (id string, akey string, vkey string) (item AcctVerification, err error) {
	date := time.Now().UTC().Format(time.RFC3339)
	db_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("verification"))

		err := b.Put([]byte(id + akey + vkey), []byte(date))
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		fmt.Println(err)
		return item, err
	}

	item = AcctVerification{id, akey, vkey, date}
	return item, nil
}

func FindAcctVerification (id string, akey string, vkey string) (item AcctVerification, err error) {
	item = AcctVerification{}
	db_view(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("verification"))

		v := b.Get([]byte(id + akey + vkey))

		item = AcctVerification{id, akey, vkey, string(v)}

		return nil
	})
	if err != nil {
		fmt.Println(err)
		return item, err
	}

	return item, nil
}

func CountAcctVerification (id string) (count int, err error) {
	count = 0
	db_view(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("verification")).Cursor()

		prefix := []byte(id)
		for k, _ := b.Seek(prefix); bytes.HasPrefix(k, prefix); k, _ = b.Next() {
			count = count + 1
		}
		return nil
	})
	if err != nil {
		fmt.Println(err)
		return 0, err
	}

	return count, nil
}
