package model

import (
	"bytes"
	"fmt"
	"github.com/boltdb/bolt"
	"time"
	"strconv"
)

type Invite struct {
	Id         string `json:"id"`
	Hash       string `json:"hash"`
	Expiration int64  `json:"ts"`
}

func (o *Invite) Delete() (err error) {
	db_invite_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("invite"))
		c := b.Cursor()

		prefix := []byte(o.Id)
		for k, _ := c.Seek(prefix); bytes.HasPrefix(k, prefix); k, _ = c.Next() {
			b.Delete(k)
		}
		return nil
	})
	if err != nil {
		fmt.Println(err)
		return err
	}

	return nil
}

func InviteCreate(id string, hash string, ttl int64) (item Invite, err error) {
	ts := time.Now().UnixNano() + ttl
	v := fmt.Sprintf("%d", ts)
	db_invite_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("invite"))

		err := b.Put([]byte(id + hash), []byte(v))
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		fmt.Println(err)
		return item, err
	}


	item = Invite{id, hash, ts}
	return item, nil
}

func InviteFind(id string, hash string) (item Invite, err error) {
	item = Invite{}
	db_invite_view(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("invite"))

		v := b.Get([]byte(id + hash))

		ts, _ := strconv.Atoi(string(v))
		item = Invite{id, hash, int64(ts)}

		return nil
	})
	if err != nil {
		fmt.Println(err)
		return item, err
	}

	return item, nil
}
