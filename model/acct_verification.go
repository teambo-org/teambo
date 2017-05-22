package model

import (
	// "bytes"
	"log"
	"github.com/boltdb/bolt"
	"time"
	"strconv"
)

type AcctVerification struct {
	Hkey    string `json:"-"`
	Akey    string `json:"akey"`
	Vkey    string `json:"vkey"`
}

func (av *AcctVerification) Delete() (err error) {
	db_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("verification"))
		b.Delete([]byte(av.Hkey))
		return nil
	})
	if err != nil {
		log.Println(err)
		return err
	}

	return nil
}

func CreateAcctVerification(id string, akey string, vkey string) (item AcctVerification, err error) {
	hkey := acct_hkey(id, akey)

	expires := strconv.Itoa(int(time.Now().Add(30 * time.Minute).UnixNano()))
	db_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("verification"))
		err := b.Put([]byte(hkey), []byte(vkey))
		if err != nil {
			return err
		}
		b = tx.Bucket([]byte("verification_expires"))
		err = b.Put([]byte(expires), []byte(hkey))
		if err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		log.Println(err)
		return item, err
	}

	item = AcctVerification{hkey, akey, vkey}
	return item, nil
}

func FindAcctVerification(id string, akey string) (item AcctVerification, err error) {
	hkey := acct_hkey(id, akey)

	item = AcctVerification{}
	db_view(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("verification"))
		v := b.Get([]byte(hkey))
		item = AcctVerification{hkey, akey, string(v)}
		return nil
	})
	if err != nil {
		log.Println(err)
		return item, err
	}

	return item, nil
}
