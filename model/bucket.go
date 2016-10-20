package model

import (
	"../util"
	"bytes"
	"fmt"
	"github.com/boltdb/bolt"
	// "errors"
)

type Bucket struct {
	Id         string `json:"id"`
	Ciphertext string `json:"ct"`
}

func (tb Bucket) Save(team_id string) (err error) {
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte("bucket"))

		err = b.Put([]byte(tb.Id), []byte(tb.Ciphertext))
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

func (tb Bucket) Remove(team_id string) (err error) {
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte("bucket"))

		err = b.Delete([]byte(tb.Id))
		if err != nil {
			return err
		}

		err = tx.DeleteBucket([]byte(tb.Id))

		return nil
	})
	if err != nil {
		fmt.Println(err)
		return err
	}
	return nil
}

func NewBucket(team_id string) Bucket {
	id := util.RandStr(8)
	for {
		exists, _ := BucketExists(team_id, id)
		if exists {
			id = util.RandStr(8)
		} else {
			break
		}
	}
	return Bucket{id, "new"}
}

func FindBucket(team_id string, id string) (item Bucket, err error) {
	ct := ""
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte("bucket"))

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
		item = Bucket{id, ct}
		return item, nil
	}
	return item, nil
}

func AllBuckets(team_id string) (buckets []Bucket, err error) {
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, _ := tx.CreateBucketIfNotExists([]byte("bucket"))
		b.ForEach(func(k, v []byte) error {
			buckets = append(buckets, Bucket{string(k), string(v)})
			return nil
		})
		return nil
	})
	if err != nil {
		fmt.Println(err)
		return buckets, err
	}
	return buckets, nil
}

func BucketExists(team_id string, id string) (exists bool, err error) {
	exists = false
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, _ := tx.CreateBucketIfNotExists([]byte("bucket"))
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
