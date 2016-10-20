package model

import (
	"../util"
	"bytes"
	"fmt"
	"github.com/boltdb/bolt"
	// "errors"
)

type Item struct {
	Id         string `json:"id"`
	Ciphertext string `json:"ct"`
}

func (ti Item) Save(team_id string) (err error) {
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte("item"))

		err = b.Put([]byte(ti.Id), []byte(ti.Ciphertext))
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		fmt.Println(err)
		return err
	}

	return nil
}

func (ti Item) Remove(team_id string) (err error) {
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte("item"))

		err = b.Delete([]byte(ti.Id))
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		fmt.Println(err)
		return err
	}
	return nil
}

func NewItem(team_id string) Item {
	id := util.RandStr(8)
	for {
		exists, _ := ItemExists(team_id, id)
		if exists {
			id = util.RandStr(8)
		} else {
			break
		}
	}
	return Item{id, "new"}
}

func FindItem(team_id string, id string) (item Item, err error) {
	ct := ""
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte("item"))

		v := b.Get([]byte(id))
		if err != nil {
			return err
		}

		ct = string(v)

		return nil
	})
	if err != nil {
		fmt.Println(err)
		return item, err
	}

	if ct != "" {
		item = Item{id, ct}
		return item, nil
	}
	return item, nil
}

func AllItems(team_id string) (items []Item, err error) {
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, _ := tx.CreateBucketIfNotExists([]byte("item"))
		b.ForEach(func(k, v []byte) error {
			items = append(items, Item{string(k), string(v)})
			return nil
		})
		return nil
	})
	if err != nil {
		fmt.Println(err)
		return items, err
	}
	return items, nil
}

func ItemExists(team_id string, id string) (exists bool, err error) {
	exists = false
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, _ := tx.CreateBucketIfNotExists([]byte("item"))
		c := b.Cursor()

		prefix := []byte(id)
		for k, _ := c.Seek(prefix); bytes.HasPrefix(k, prefix); k, _ = c.Next() {
			exists = true
		}
		return nil
	})
	if err != nil {
		fmt.Println(err)
		return false, err
	}

	return exists, nil
}
