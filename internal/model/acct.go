package model

import (
	"crypto/sha256"
	"encoding/base64"

	"github.com/teambo-org/teambo/internal/util"
)

type Acct struct {
	AcctId     string `json:"-"`
	Hkey       string `json:"-"`
	Id         string `json:"id"`
	Akey       string `json:"akey"`
	Ciphertext string `json:"ct"`
}

func (a *Acct) Delete() (err error) {
	db_auth.Delete("auth-" + a.Hkey)
	db_auth.Delete("protection-" + a.Hkey)
	return db_acct.Delete("acct-" + a.AcctId)
}

func (a *Acct) Move(new_akey, new_pkey, ct string) (err error) {
	hkey := acct_hkey(a.Id, new_akey)
	phkey := acct_hkey(a.Id, new_pkey)

	transaction, err := db_auth.OpenTransaction()
	if err != nil {
		return err
	}
	transaction.Put("auth-"+hkey, a.AcctId)
	transaction.Put("protection-"+hkey, phkey)
	transaction.Delete("auth-" + a.Hkey)
	transaction.Delete("protection-" + a.Hkey)
	err = transaction.Commit()
	if err != nil {
		return err
	}
	err = db_acct.Put("acct-"+a.AcctId, ct)
	if err == nil {
		a.Hkey = hkey
		a.Akey = new_akey
		a.Ciphertext = ct
	}
	return err
}

func (a *Acct) Update(ct string) (err error) {
	err = db_acct.Put("acct-"+a.AcctId, ct)
	if err == nil {
		a.Ciphertext = ct
	}
	return err
}

func NewAcctId() string {
	id := util.RandStr(16)
	for {
		exists, _ := db_acct.Has("acct-" + id)
		if exists {
			id = util.RandStr(16)
		} else {
			break
		}
	}
	return id
}

func CreateAcct(id, akey, pkey, ct string) (item Acct, err error) {
	hkey := acct_hkey(id, akey)
	phkey := acct_hkey(id, pkey)
	acctId := NewAcctId()
	batch := db_auth.Batch()
	batch.Put("auth-"+hkey, acctId)
	batch.Put("protection-"+hkey, phkey)
	err = batch.Write()
	if err != nil {
		return item, err
	}
	err = db_acct.Put("acct-"+acctId, ct)
	if err == nil {
		item = Acct{acctId, hkey, id, akey, ct}
	}
	return item, err
}

func FindAcct(id, akey string) (item Acct, err error) {
	hkey := acct_hkey(id, akey)
	acctId, err := db_auth.Get("auth-" + hkey)
	if acctId == "" {
		return item, err
	}
	ct, err := db_acct.Get("acct-" + acctId)
	if ct != "" {
		item = Acct{acctId, hkey, id, akey, ct}
	}
	return item, err
}

func acct_hkey(id string, akey string) string {
	h := sha256.New()
	h.Write([]byte(id + akey + util.Config.Get("secret")))
	hkey := base64.StdEncoding.EncodeToString(h.Sum(nil))
	return hkey
}
