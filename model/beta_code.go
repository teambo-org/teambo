package model

import (
	// "bytes"
	"github.com/boltdb/bolt"
	"log"
	// "time"
)

type BetaCode struct {
	Code  string `json:"code"`
	Found string `json:"found"`
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
