package model

import (
	"bytes"
	"fmt"
	"github.com/boltdb/bolt"
	"../util"
	// "errors"
)

type TeamMember struct {
	Mkey       string `json:"mkey"`
	Ciphertext string `json:"ct"`
}

func (tm *TeamMember) Save (team_id string) (err error) {
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

func (tm *TeamMember) Remove (team_id string) (err error) {
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

func NewTeamMember (team_id string) TeamMember {
	mkey := util.RandStr(8)
	for {
		exists, _ := TeamMemberExists(team_id, mkey)
		if exists {
			mkey = util.RandStr(8)
		} else {
			break;
		}
	}
	return TeamMember{mkey, "new"}
}

func FindTeamMember (team_id string, mkey string) (item TeamMember, err error) {
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
		item = TeamMember{mkey, ct}
		return item, nil
	}
	return item, nil
}

func TeamMemberExists (team_id string, mkey string) (exists bool, err error) {
	exists = false
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
