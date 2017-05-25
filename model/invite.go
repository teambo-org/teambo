package model

import (
	"bytes"
	"fmt"
	"github.com/boltdb/bolt"
	"time"
)

type Invite struct {
	Id   string `json:"id"`
	Hash string `json:"hash"`
}

func (o *Invite) Delete() (err error) {
	db_invite_update(func(tx *bolt.Tx) error {
		tx.Bucket([]byte("invite")).Delete([]byte(o.Id))
		tx.Bucket([]byte("invite_response")).Delete([]byte(o.Id))
		tx.Bucket([]byte("invite_acceptance")).Delete([]byte(o.Id))
		tx.Bucket([]byte("invite_redeemed")).Delete([]byte(o.Id))
		return nil
	})
	return nil
}

func (o *Invite) Redeem() bool {
	redeemed := false
	ts := fmt.Sprintf("%d", time.Now().UnixNano())
	db_invite_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("invite_redeemed"))
		v := b.Get([]byte(o.Id))
		if string(v) != "0" {
			return nil
		}
		err := b.Put([]byte(o.Id), []byte(ts))
		if err != nil {
			return err
		}
		redeemed = true
		return nil
	})
	return redeemed
}

func (o *Invite) MakeRedeemable() bool {
	err := db_invite_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("invite_redeemed"))
		err := b.Put([]byte(o.Id), []byte("0"))
		if err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return false
	}
	return true
}

func InviteCreate(id string, hash string, ttl int64) (item Invite, err error) {
	ts := fmt.Sprintf("%d", time.Now().UnixNano() + ttl)
	db_invite_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("invite"))
		err := b.Put([]byte(id), []byte(hash))
		if err != nil {
			return err
		}
		b = tx.Bucket([]byte("invite_expire"))
		err = b.Put([]byte(ts), []byte(id))
		if err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		fmt.Println(err)
		return item, err
	}

	item = Invite{id, hash}
	return item, nil
}

func InviteFind(id string) (item Invite, err error) {
	item = Invite{}
	db_invite_view(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("invite"))
		v := b.Get([]byte(id))
		if string(v) == "" {
			return nil
		}
		item.Id = id
		item.Hash = string(v)
		return nil
	})
	return item, nil
}

type InviteExpires struct {
	Ts     string `json:"ts"`
	Invite Invite `json:"ts"`
}

func (o *InviteExpires) Delete() (err error) {
	db_invite_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("invite_expire"))
		b.Delete([]byte(o.Ts))
		return nil
	})
	return nil
}

func InviteFindExpired() (items []InviteExpires, err error) {
	now := fmt.Sprintf("%d", time.Now().UnixNano())
	db_invite_view(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("invite_expire"))
		c := b.Cursor()
		prefix := []byte("")
		for ts, id := c.Seek(prefix); bytes.HasPrefix(ts, prefix); ts, id = c.Next() {
			if len(ts) > 0 && string(ts) < now {
				items = append(items, InviteExpires{
					string(ts),
					Invite{string(id), ""},
				})
			} else {
				return nil
			}
		}
		return nil
	})
	return items, nil
}
