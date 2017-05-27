package model

import (
	// "bytes"
	"github.com/boltdb/bolt"
	"log"
	"strconv"
	"time"
	"bytes"
	"../util"
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
	ticker := time.NewTicker(10 * time.Minute)
	go func() {
		for _ = range ticker.C {
			at.PurgeExpired()
			at.PurgeExpiredResets()
		}
	}()
	return
}

func (at *acctThrottle) PurgeExpired() (err error) {
	now := strconv.Itoa(int(time.Now().UnixNano()))
	err = db_throttle_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("throttle_expires"))
		b2 := tx.Bucket([]byte("throttle"))
		c := b.Cursor()
		prefix := []byte("")
		for ts, id := c.Seek(prefix); bytes.HasPrefix(ts, prefix); ts, id = c.Next() {
			if string(ts) != "" && string(ts) < now {
				b.Delete(ts)
				b2.Delete([]byte(string(id) + "-" + string(ts)))
			} else {
				return nil
			}
		}
		return nil
	})
	return err
}

func (at *acctThrottle) PurgeExpiredResets() (err error) {
	now := strconv.Itoa(int(time.Now().UnixNano()))
	err = db_throttle_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("throttle_reset_expires"))
		b2 := tx.Bucket([]byte("throttle_reset"))
		c := b.Cursor()
		prefix := []byte("")
		for ts, id := c.Seek(prefix); bytes.HasPrefix(ts, prefix); ts, id = c.Next() {
			if string(ts) != "" && string(ts) < now {
				b.Delete(ts)
				b2.Delete([]byte(string(id) + "-" + string(ts)))
			} else {
				return nil
			}
		}
		return nil
	})
	return err
}

func (at *acctThrottle) Clear(id string) (err error) {
	err = db_throttle_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("throttle"))
		c := b.Cursor()
		prefix := []byte(id)
		for k, _ := c.Seek(prefix); bytes.HasPrefix(k, prefix); k, _ = c.Next() {
			b.Delete(k)
		}
		return nil
	})
	if err != nil {
		log.Println(err)
		return err
	}

	return nil
}

func (at *acctThrottle) Check(id string) bool {
	return at.Remaining(id) > 0
}

func (at *acctThrottle) Remaining(id string) int {
	total := 0
	db_throttle_view(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("throttle"))
		c := b.Cursor()
		prefix := []byte(id)
		for k, _ := c.Seek(prefix); bytes.HasPrefix(k, prefix); k, _ = c.Next() {
			total++
		}
		return nil
	})
	return at.Limit - total
}

func (at *acctThrottle) Log(id string) (err error) {
	expires := strconv.Itoa(int(time.Now().Add(time.Duration(at.TTL) * time.Hour).UnixNano()))
	err = db_throttle_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("throttle_expires"))
		b.Put([]byte(expires), []byte(id))
		b2 := tx.Bucket([]byte("throttle"))
		b2.Put([]byte(id + "-" + expires), []byte("1"))
		return nil
	})
	return err
}

func (at *acctThrottle) RemainingResets(id string) int {
	total := 0
	db_throttle_view(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("throttle_reset"))
		c := b.Cursor()
		prefix := []byte(id)
		for k, _ := c.Seek(prefix); bytes.HasPrefix(k, prefix); k, _ = c.Next() {
			total++
		}
		return nil
	})
	return at.Resets - total
}

func (at *acctThrottle) CreateReset(id string) string {
	rkey := util.RandStr(16)
	expires := strconv.Itoa(int(time.Now().Add(time.Duration(at.TTL) * time.Hour).UnixNano()))
	db_throttle_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("throttle_reset_expires"))
		b.Put([]byte(expires), []byte(id))
		b2 := tx.Bucket([]byte("throttle_reset"))
		b2.Put([]byte(id + "-" + expires), []byte(rkey))
		return nil
	})
	return rkey
}

func (at *acctThrottle) HasReset(id string) bool {
	found := false
	db_throttle_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("throttle_reset"))
		c := b.Cursor()
		prefix := []byte(id)
		for k, v := c.Seek(prefix); bytes.HasPrefix(k, prefix); k, v = c.Next() {
			if string(v) != "0" {
				found = true
				return nil
			}
		}
		return nil
	})
	return found
}

func (at *acctThrottle) RedeemReset(id string, rkey string) bool {
	found := false
	db_throttle_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("throttle_reset"))
		c := b.Cursor()
		prefix := []byte(id)
		for k, v := c.Seek(prefix); bytes.HasPrefix(k, prefix); k, v = c.Next() {
			if rkey != "0" && string(v) == rkey {
				b.Put([]byte(k), []byte("0"))
				found = true
				return nil
			}
		}
		return nil
	})
	if found {
		at.Clear(id)
	}
	return found
}

