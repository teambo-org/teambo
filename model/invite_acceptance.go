package model

import (
	"bytes"
	"fmt"
	"github.com/boltdb/bolt"
)

type InviteAcceptance struct {
	Id         string `json:"id"`
	Ciphertext string `json:"ct"`
}

func (o *InviteAcceptance) Delete() (err error) {
	db_invite_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("invite_acceptance"))
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

func InviteAcceptanceCreate(id string, ct string) (item InviteAcceptance, err error) {
	db_invite_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("invite_acceptance"))

		err := b.Put([]byte(id), []byte(ct))
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		fmt.Println(err)
		return item, err
	}

	item = InviteAcceptance{id, ct}
	return item, nil
}

func InviteAcceptanceFind(id string) (item InviteAcceptance, err error) {
	item = InviteAcceptance{}
	db_invite_view(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("invite_acceptance"))

		v := b.Get([]byte(id))

		item = InviteAcceptance{id, string(v)}

		return nil
	})
	if err != nil {
		fmt.Println(err)
		return item, err
	}

	return item, nil
}
