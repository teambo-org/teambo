package model

import (
	"../util"
	"bytes"
	"fmt"
	"github.com/boltdb/bolt"
	// "errors"
)

type Member struct {
	Mkey       string `json:"mkey"`
	Ciphertext string `json:"ct"`
}

func (tm *Member) Save(team_id string) (err error) {
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte("member"))
		err = b.Put([]byte(tm.Mkey), []byte(tm.Ciphertext))
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

func (tm *Member) Remove(team_id string) (err error) {
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte("member"))
		err = b.Delete([]byte(tm.Mkey))
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

func NewMember(team_id string) Member {
	mkey := util.RandStr(8)
	for {
		exists, _ := MemberExists(team_id, mkey)
		if exists {
			mkey = util.RandStr(8)
		} else {
			break
		}
	}
	return Member{mkey, "new"}
}

func FindMember(team_id string, mkey string) (item Member, err error) {
	ct := ""
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte("member"))
		if err != nil {
			return err
		}
		c := b.Cursor()
		prefix := []byte(mkey)
		for k, v := c.Seek(prefix); bytes.HasPrefix(k, prefix); k, _ = c.Next() {
			ct = string(v)
		}
		return nil
	})
	if err != nil {
		fmt.Println(err)
		return item, err
	}
	if ct != "" {
		item = Member{mkey, ct}
		return item, nil
	}
	return item, nil
}

func MemberExists(team_id string, mkey string) (exists bool, err error) {
	exists = false
	if mkey == "" {
		return false, nil
	}
	db_team_update(team_id, func(tx *bolt.Tx) error {
		b, _ := tx.CreateBucketIfNotExists([]byte("member"))
		c := b.Cursor()

		prefix := []byte(mkey)
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
