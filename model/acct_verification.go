package model

import (
	// "bytes"
	"log"
	"github.com/boltdb/bolt"
	"time"
	"strconv"
)

type AcctVerification struct {
	Akey    string `json:"akey"`
	Vkey    string `json:"vkey"`
}

type BetaCode struct {
	Code    string `json:"code"`
	Found   string `json:"found"`
}

func (av *AcctVerification) Delete() (err error) {
	db_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("verification"))
		b.Delete([]byte(av.Akey))
		return nil
	})
	if err != nil {
		log.Println(err)
		return err
	}

	return nil
}

func CreateAcctVerification(akey string, vkey string) (item AcctVerification, err error) {
	expires := strconv.Itoa(int(time.Now().Unix()))
	db_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("verification"))
		err := b.Put([]byte(akey), []byte(vkey))
		if err != nil {
			return err
		}

		b = tx.Bucket([]byte("verification_expires"))
		err = b.Put([]byte(expires), []byte(akey))
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		log.Println(err)
		return item, err
	}

	item = AcctVerification{akey, vkey}
	return item, nil
}

func FindAcctVerification(akey string) (item AcctVerification, err error) {
	item = AcctVerification{}
	db_view(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("verification"))
		v := b.Get([]byte(akey))
		item = AcctVerification{akey, string(v)}
		return nil
	})
	if err != nil {
		log.Println(err)
		return item, err
	}

	return item, nil
}

func (bc *BetaCode) Delete() (err error) {
	db_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("beta_code"))
		b.Delete([]byte(bc.Code))
		return nil
	})
	if err != nil {
		log.Println(err)
		return err
	}
	return nil
}

func FindBetaCode(beta string) (item BetaCode, err error) {
	item = BetaCode{}
	db_view(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("beta_code"))
		v := b.Get([]byte(beta))
		item = BetaCode{beta, string(v)}
		return nil
	})
	if err != nil {
		log.Println(err)
		return item, err
	}

	return item, nil
}
