package model

import (
	// "bytes"
	"github.com/boltdb/bolt"
)

type AcctProtection struct {
	Id      string `json:"id"`
	Hkey    string `json:"-"`
	PHkey   string `json:"-"`
	Akey    string `json:"akey"`
	Pkey    string `json:"pkey"`
}

func (ap *AcctProtection) Delete() (err error) {
	db_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("acct_protection"))
		b.Delete([]byte(ap.Hkey))
		return nil
	})
	if err != nil {
		log.Println(err)
		return err
	}

	return nil
}

func (ap *AcctProtection) Validate(pkey string) bool {
	phkey := acct_hkey(ap.Id, pkey)
	return ap.PHkey != "" && phkey == ap.PHkey
}

func FindAcctProtection(id string, akey string) (item AcctProtection, err error) {
	hkey := acct_hkey(id, akey)

	item = AcctProtection{}
	db_view(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("acct_protection"))
		v := b.Get([]byte(hkey))
		item = AcctProtection{id, hkey, string(v), akey, ""}
		return nil
	})
	if err != nil {
		log.Println(err)
		return item, err
	}

	return item, nil
}
