package model

import (
	// "time"
	// "bytes"
	"../util"
	"fmt"
	"github.com/boltdb/bolt"
	// "errors"
	"crypto/sha256"
	"encoding/base64"
)

type Acct struct {
	Hkey       string `json:"-"`
	Id         string `json:"id"`
	Akey       string `json:"akey"`
	Ciphertext string `json:"ct"`
}

func (a *Acct) Delete() (err error) {
	db_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("acct"))
		err = b.Delete([]byte(a.Hkey))
		if err != nil {
			return err
		}
		return nil
	})
	return err
}

func (a *Acct) Move(akey string, pkey string, ct string) (err error) {
	hkey := acct_hkey(a.Id, akey)
	phkey := acct_hkey(a.Id, pkey)
	err = db_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("acct"))
		err = b.Put([]byte(hkey), []byte(ct))
		if err != nil {
			return err
		}
		err = b.Delete([]byte(a.Hkey))
		if err != nil {
			return err
		}
		// Temporary fallback
		err = b.Delete([]byte(a.Akey))
		if err != nil {
			return err
		}
		b = tx.Bucket([]byte("acct_protection"))
		err = b.Put([]byte(hkey), []byte(phkey))
		if err != nil {
			return err
		}
		err = b.Delete([]byte(a.Hkey))
		if err != nil {
			return err
		}
		return nil
	})
	if err == nil {
		a.Hkey = hkey
		a.Akey = akey
		a.Ciphertext = ct
	}
	return err
}

func (a *Acct) Update(ct string) (err error) {
	err = db_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("acct"))
		err = b.Put([]byte(a.Hkey), []byte(ct))
		if err != nil {
			return err
		}
		// Temporary fallback
		err = b.Delete([]byte(a.Akey))
		if err != nil {
			return err
		}
		return nil
	})
	if err == nil {
		a.Ciphertext = ct
	}
	return err
}

func CreateAcct(id string, akey string, pkey string, ct string) (item Acct, err error) {
	hkey := acct_hkey(id, akey)
	phkey := acct_hkey(id, pkey)
	db_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("acct"))
		err := b.Put([]byte(hkey), []byte(ct))
		if err != nil {
			return err
		}
		b = tx.Bucket([]byte("acct_protection"))
		err = b.Put([]byte(hkey), []byte(phkey))
		if err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		fmt.Println(err)
		return item, err
	}

	item = Acct{hkey, id, akey, ct}
	return item, nil
}

func FindAcct(id string, akey string) (item Acct, err error) {
	hkey := acct_hkey(id, akey)
	ct := ""
	db_view(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("acct"))
		ct = string(b.Get([]byte(hkey)))
		// Temporary fallback
		if ct == "" {
			ct = string(b.Get([]byte(akey)))
		}
		return nil
	})
	if err != nil {
		fmt.Println(err)
		return item, err
	}

	if ct != "" {
		item = Acct{hkey, id, akey, ct}
		return item, nil
	}
	return item, nil
}

func acct_hkey(id string, akey string) string {
	h := sha256.New()
	h.Write([]byte(id + akey + util.Config("secret")))
	hkey := base64.StdEncoding.EncodeToString(h.Sum(nil))
	return hkey
}
