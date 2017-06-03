package model

import (
	"../util"
	"crypto/sha256"
	"encoding/base64"
	// "log"
)

type Acct struct {
	Hkey       string `json:"-"`
	Id         string `json:"id"`
	Akey       string `json:"akey"`
	Ciphertext string `json:"ct"`
}

func (a *Acct) Delete() (err error) {
	return db_acct.Delete("acct-"+a.Hkey)
}

func (a *Acct) Move(akey, pkey, ct string) (err error) {
	hkey := acct_hkey(a.Id, akey)
	phkey := acct_hkey(a.Id, pkey)
	batch := db_acct.Batch()
	batch.Delete("acct-" + a.Hkey)
	batch.Delete("acct_protection-" + a.Hkey)
	batch.Put("acct-" + hkey, ct)
	batch.Put("acct_protection-" + hkey, phkey)
	err = batch.Write()
	if err == nil {
		a.Hkey = hkey
		a.Akey = akey
		a.Ciphertext = ct
	}
	return err
}

func (a *Acct) Update(ct string) (err error) {
	err = db_acct.Put("acct-" + a.Hkey, ct)
	if err == nil {
		a.Ciphertext = ct
	}
	return err
}

func CreateAcct(id, akey, pkey, ct string) (item Acct, err error) {
	hkey := acct_hkey(id, akey)
	phkey := acct_hkey(id, pkey)
	batch := db_acct.Batch()
	batch.Put("acct-" + hkey, ct)
	batch.Put("acct_protection-" + hkey, phkey)
	err = batch.Write()
	if err == nil {
		item = Acct{hkey, id, akey, ct}
	}
	return item, err
}

func FindAcct(id, akey string) (item Acct, err error) {
	hkey := acct_hkey(id, akey)
	ct, err := db_acct.Get("acct-" + hkey)
	if len(ct) > 0 {
		item = Acct{hkey, id, akey, ct}
	}
	return item, err
}

func acct_hkey(id string, akey string) string {
	h := sha256.New()
	h.Write([]byte(id + akey + util.Config("secret")))
	hkey := base64.StdEncoding.EncodeToString(h.Sum(nil))
	return hkey
}
