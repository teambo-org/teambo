package model

import (
	"../util"
	"bytes"
	"fmt"
	"github.com/boltdb/bolt"
	// "errors"
)

type TeamBucket struct {
	Name string
}

type TeamObject struct {
	Bucket     string `json:"-"`
	Id         string `json:"id"`
	Ciphertext string `json:"ct"`
}

func (o TeamObject) Save(team_id string) (err error) {
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte(o.Bucket))

		err = b.Put([]byte(o.Id), []byte(o.Ciphertext))
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

func (o TeamObject) Remove(team_id string) (err error) {
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte(o.Bucket))

		err = b.Delete([]byte(o.Id))
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

func (tb TeamBucket) NewObject(team_id string) TeamObject {
	id := util.RandStr(8)
	for {
		exists, _ := tb.Exists(team_id, id)
		if exists {
			id = util.RandStr(8)
		} else {
			break
		}
	}
	return TeamObject{tb.Name, id, "new"}
}

func (tb TeamBucket) Find(team_id string, id string) (o TeamObject, err error) {
	ct := ""
	db_team_view(team_id, func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(tb.Name))
		if b == nil {
			return nil
		}

		v := b.Get([]byte(id))
		if err != nil {
			return err
		}

		ct = string(v)

		return nil
	})
	if err != nil {
		fmt.Println(err)
		return o, err
	}

	if ct != "" {
		o = TeamObject{tb.Name, id, ct}
		return o, nil
	}
	return o, nil
}

func (tb TeamBucket) All(team_id string) (o []TeamObject, err error) {
	db_team_view(team_id, func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(tb.Name))
		if b == nil {
			return nil
		}
		b.ForEach(func(k, v []byte) error {
			o = append(o, TeamObject{tb.Name, string(k), string(v)})
			return nil
		})
		return nil
	})
	if err != nil {
		fmt.Println(err)
		return o, err
	}
	return o, nil
}

func (tb TeamBucket) Exists(team_id string, id string) (exists bool, err error) {
	exists = false
	db_team_view(team_id, func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(tb.Name))
		if b == nil {
			return nil
		}
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
