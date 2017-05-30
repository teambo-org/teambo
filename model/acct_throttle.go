package model

import (
	"../util"
	"strconv"
	"time"
	// "log"
)

type acctThrottle struct {
	Resets  int
	Limit   int
	TTL     int
}

var AcctThrottle = acctThrottle{}

func (at *acctThrottle) Init(config map[string]string) {
	at.Resets, _ = strconv.Atoi(config["acct.throttle.resets"])
	at.Limit, _ = strconv.Atoi(config["acct.throttle.limit"])
	at.TTL, _ = strconv.Atoi(config["acct.throttle.ttl"])
}

func (at *acctThrottle) PurgeExpired() ([]string, error) {
	return PurgeExpired(db_throttle, "throttle")
}

func (at *acctThrottle) PurgeExpiredResets() ([]string, error) {
	return PurgeExpired(db_throttle, "throttle_reset")
}

func (at *acctThrottle) Clear(id string) (err error) {
	batch := db_throttle.Batch()
	iter := db_throttle.PrefixIterator([]byte("throttle-" + id))
	for iter.Next() {
		batch.Delete(iter.Key())
	}
	iter.Release()
	err = iter.Error()
	if err == nil {
		err = db_throttle.Write(batch)
	}
	return err
}

func (at *acctThrottle) Remaining(id string) int {
	total := 0
	iter := db_throttle.PrefixIterator([]byte("throttle-" + id))
	for iter.Next() {
		total++
	}
	iter.Release()
	return at.Limit - total
}

func (at *acctThrottle) Log(id string) error {
	expires := strconv.Itoa(int(time.Now().Add(time.Duration(at.TTL) * time.Hour).UnixNano()))
	batch := db_throttle.Batch()
	batch.Put([]byte("throttle_expires-" + expires), []byte(id))
	batch.Put([]byte("throttle-" + id + "-" + expires), []byte("1"))
	return db_throttle.Write(batch)
}

func (at *acctThrottle) RemainingResets(id string) int {
	total := 0
	iter := db_throttle.PrefixIterator([]byte("throttle_reset-" + id))
	for iter.Next() {
		total++
	}
	iter.Release()
	return at.Resets - total
}

func (at *acctThrottle) CreateReset(id string) string {
	rkey := util.RandStr(16)
	expires := strconv.Itoa(int(time.Now().Add(time.Duration(at.TTL) * time.Hour).UnixNano()))
	db_throttle.Put([]byte("throttle_reset_expires-" + expires), []byte(id))
	db_throttle.Put([]byte("throttle_reset-" + id + "-" + expires), []byte(rkey))
	return rkey
}

func (at *acctThrottle) HasReset(id string) bool {
	found := false
	iter := db_throttle.PrefixIterator([]byte("throttle_reset-" + id))
	for iter.Next() {
		if string(iter.Value()) != "0" {
			found = true
			break
		}
	}
	iter.Release()
	return found
}

func (at *acctThrottle) RedeemReset(id, rkey string) bool {
	key := []byte("")
	iter := db_throttle.PrefixIterator([]byte("throttle_reset-" + id))
	for iter.Next() {
		v := string(iter.Value())
		if v != "0" && v == rkey {
			key = iter.Key()
			break
		}
	}
	iter.Release()
	if len(key) > 0 {
		db_throttle.Put(key, []byte("0"))
		at.Clear(id)
		return true
	}
	return false
}
