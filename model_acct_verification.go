package main

import (
    "time"
	"fmt"
	"bytes"
	"errors"
    "github.com/boltdb/bolt"
)

type AcctVerification struct {
    Hash string  `json:"hash"`
    Akey string  `json:"akey"`
    Vkey string  `json:"vkey"`
    Date string  `json:"date"`
}

func acct_verification_create(hash string, akey string, vkey string) (item AcctVerification, err error) {
	date := time.Now().UTC().Format(time.RFC3339)
    db_update(func(tx *bolt.Tx) error {
        b := tx.Bucket([]byte("verification"))
		
		err := b.Put([]byte(hash + akey + vkey), []byte(date))
		if err != nil { return err }
		
        return nil
    })
	if err != nil { fmt.Println(err); return item, err }
    
    item = AcctVerification{hash, akey, vkey, date}
    return item, nil
}

func acct_verification_find(hash string, akey string, vkey string) (item AcctVerification, err error) {
	date := ""
    db_view(func(tx *bolt.Tx) error {
        b := tx.Bucket([]byte("verification"))
		
		v := b.Get([]byte(hash + akey + vkey))
		if err != nil { return err }
		
		date = string(v)
		
        return nil
    })
	if err != nil { fmt.Println(err); return item, err }
    
	if date == "true" {
		item = AcctVerification{hash, akey, vkey, date}
		return item, nil
	} else {
		return item, errors.New("Not Found")
	}
}

func acct_verification_delete(hash string, akey string) (err error) {
    db_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("verification"))
		c := b.Cursor()

		prefix := []byte(hash + akey)
		for k, _ := c.Seek(prefix); bytes.HasPrefix(k, prefix); k, _ = c.Next() {
			b.Delete(k)
		}
        return nil
    })
	if err != nil { fmt.Println(err); return err }
    
    return nil
}
