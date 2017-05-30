package model

import (
	"../util"
	"bytes"
	"fmt"
	"github.com/boltdb/bolt"
	// "log"
)

type TeamBucket struct {
	TeamId string
	Name   string
}

func (tb TeamBucket) NewObject(id string) TeamObject {
	if id == "" {
		id = util.RandStr(8)
	}
	for {
		exists, _ := tb.Exists(id)
		if exists {
			id = util.RandStr(8)
		} else {
			break
		}
	}
	return TeamObject{tb.TeamId, tb.Name, id, "new"}
}

func (tb TeamBucket) Find(id string) (o TeamObject, err error) {
	ct := ""
	db_team_view(tb.TeamId, func(tx *bolt.Tx) error {
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
		o = TeamObject{tb.TeamId, tb.Name, id, ct}
		return o, nil
	}
	return o, nil
}

func (tb TeamBucket) All() (o []TeamObject, err error) {
	db_team_view(tb.TeamId, func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(tb.Name))
		if b == nil {
			return nil
		}
		b.ForEach(func(k, v []byte) error {
			if string(v) == "new" {
				return nil
			}
			o = append(o, TeamObject{tb.TeamId, tb.Name, string(k), string(v)})
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

func (tb TeamBucket) Exists(id string) (exists bool, err error) {
	exists = false
	err = db_team_view(tb.TeamId, func(tx *bolt.Tx) error {
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

func (tb TeamBucket) RemoveByValue(val string) (err error) {
	err = db_team_update(tb.TeamId, func(tx *bolt.Tx) error {
		b, _ := tx.CreateBucketIfNotExists([]byte(tb.Name))
		b.ForEach(func(k, v []byte) error {
			if string(v) == val {
				b.Delete([]byte(k))
			}
			return nil
		})
		return nil
	})
	if err != nil {
		fmt.Println(err)
		return err
	}
	return nil
}

func (tb TeamBucket) Count() (total int) {
	total = 0
	db_team_view(tb.TeamId, func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(tb.Name))
		b.ForEach(func(k, v []byte) error {
			total++
			return nil
		})
		return nil
	})
	return total
}
