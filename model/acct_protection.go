package model

import (
// "log"
)

type AcctProtection struct {
	Id    string `json:"id"`
	Hkey  string `json:"-"`
	PHkey string `json:"-"`
	Akey  string `json:"akey"`
	Pkey  string `json:"pkey"`
}

func (o *AcctProtection) Delete() (err error) {
	return db_auth.Delete("protection-" + o.Hkey)
}

func (o *AcctProtection) Validate(pkey string) bool {
	phkey := acct_hkey(o.Id, pkey)
	return o.PHkey != "" && phkey == o.PHkey
}

func FindAcctProtection(id, akey string) (item AcctProtection, err error) {
	hkey := acct_hkey(id, akey)
	phkey, err := db_auth.Get("protection-" + hkey)
	if len(phkey) > 0 {
		item = AcctProtection{id, hkey, phkey, akey, ""}
	}
	return item, err
}
