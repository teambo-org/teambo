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
	return db_acct.Delete([]byte("verification-" + o.Hkey))
}

func CreateAcctVerification(id, akey, vkey string) (item AcctVerification, err error) {
	hkey := acct_hkey(id, akey)
	expires := strconv.Itoa(int(time.Now().Add(30 * time.Minute).UnixNano()))
	batch := db_acct.Batch()
	batch.Put([]byte("verification-" + hkey), []byte(vkey))
	batch.Put([]byte("verification_expires-" + expires), []byte(hkey))
	err = db_acct.Write(batch)
	if err == nil {
		item = AcctVerification{hkey, akey, vkey}
	}
	return item, err
}

func FindAcctVerification(id, akey string) (item AcctVerification, err error) {
	hkey := acct_hkey(id, akey)
	vkey, err := db_acct.Get([]byte("verification-" + hkey))
	if err == nil {
		item = AcctVerification{hkey, akey, string(vkey)}
	}
	return item, err
}

func AcctVerificationPurgeExpired() (ids []string, err error) {
	return PurgeExpired(db_acct, "verification")
}
