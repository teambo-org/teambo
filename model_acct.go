package main

import (
    // "time"
    "github.com/boltdb/bolt"
	"fmt"
	"bytes"
)

type Acct struct {
    Hash string       `json:"hash"`
    Akey string       `json:"akey"`
    Ciphertext string `json:"ct"`
}

func acct_create(hash string, akey string, ct string) (item Acct, err error) {
    db_update(func(tx *bolt.Tx) error {
        b := tx.Bucket([]byte("acct"))
		
		err := b.Put([]byte(hash + akey), []byte(ct))
		if err != nil { return err }
		
        return nil
    })
	if err != nil { fmt.Println(err); return item, err }
    
    item = Acct{hash, akey, ct}
    return item, nil
}

func acct_find(hash string, akey string) (item Acct, err error) {
	ct := ""
    db_view(func(tx *bolt.Tx) error {
        b := tx.Bucket([]byte("acct"))
		
		v := b.Get([]byte(hash + akey))
		if err != nil { return err }
		
		ct = string(v)
		
        return nil
    })
	if err != nil { fmt.Println(err); return item, err }
    
	if ct != "" {
		item = Acct{hash, akey, ct}
		return item, nil
	}
	return item, nil
}

func acct_exists(hash string) (exists bool, err error) {
	exists = false
    db_view(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("acct")).Cursor()

		prefix := []byte(hash)
		for k, _ := b.Seek(prefix); bytes.HasPrefix(k, prefix); k, _ = b.Next() {
			exists = true
		}
        return nil
    })
	if err != nil { fmt.Println(err); return false, err }
    
    return exists, nil
}
