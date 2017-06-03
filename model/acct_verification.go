package model

import (
	"strconv"
	"time"
	// "log"
)

type AcctVerification struct {
	Hkey string `json:"-"`
	Akey string `json:"akey"`
	Vkey string `json:"vkey"`
}

func (o *AcctVerification) Delete() (err error) {
	return db_acct.Delete("verification-" + o.Hkey)
}

func CreateAcctVerification(id, akey, vkey string) (item AcctVerification, err error) {
	hkey := acct_hkey(id, akey)
	expires := strconv.Itoa(int(time.Now().Add(30 * time.Minute).UnixNano()))
	batch := db_acct.Batch()
	batch.Put("verification-" + hkey, vkey)
	batch.Put("verification_expires-" + expires, hkey)
	err = batch.Write()
	if err == nil {
		item = AcctVerification{hkey, akey, vkey}
	}
	return item, err
}

func FindAcctVerification(id, akey string) (item AcctVerification, err error) {
	hkey := acct_hkey(id, akey)
	vkey, err := db_acct.Get("verification-" + hkey)
	if err == nil && vkey != "" {
		item = AcctVerification{hkey, akey, vkey}
	}
	return item, err
}

func AcctVerificationPurgeExpired() (ids []string, err error) {
	return PurgeExpired(db_acct, "verification")
}
