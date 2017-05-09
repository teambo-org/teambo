package model

import (
	"bytes"
	"fmt"
	"github.com/boltdb/bolt"
)

type InviteResponse struct {
	Id     string `json:"id"`
	PubKey string `json:"pubKey"`
}

func (o *InviteResponse) Delete() (err error) {
	db_invite_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("invite_response"))
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

func InviteResponseCreate(id string, pubKey string) (item InviteResponse, err error) {
	db_invite_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("invite_response"))

		err := b.Put([]byte(id), []byte(pubKey))
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		fmt.Println(err)
		return item, err
	}

	item = InviteResponse{id, pubKey}
	return item, nil
}

func InviteResponseFind(id string) (item InviteResponse, err error) {
	item = InviteResponse{}
	db_invite_view(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("invite_response"))

		v := b.Get([]byte(id))

		item = InviteResponse{id, string(v)}

		return nil
	})
	if err != nil {
		fmt.Println(err)
		return item, err
	}

	return item, nil
}
