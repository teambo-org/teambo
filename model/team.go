package model

import (
	// "time"
	"../util"
	"bytes"
	"fmt"
	"github.com/boltdb/bolt"
	// "errors"
)

type Team struct {
	Id         string `json:"id"`
	Ciphertext string `json:"ct"`
}

func (t Team) Save() (err error) {
	db_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("team"))
		err = b.Put([]byte(t.Id), []byte(t.Ciphertext))
		return err
	})
	if err != nil {
		fmt.Println(err)
		return err
	}
	return nil
}

func (t Team) Remove() (err error) {
	db_update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("team"))
		err = b.Delete([]byte(t.Id))
		return err
	})
	if err != nil {
		fmt.Println(err)
		return err
	}
	return nil
}

func (t Team) NewMember() Member {
	return NewMember(t.Id)
}

func (t Team) NewBucket() Bucket {
	return NewBucket(t.Id)
}

func (t Team) NewItem() Item {
	return NewItem(t.Id)
}

func NewTeam() Team {
	id := util.RandStr(8)
	for {
		exists, _ := TeamExists(id)
		if exists {
			id = util.RandStr(8)
		} else {
			break
		}
	}
	return Team{id, "new"}
}

func FindTeam(id string) (item Team, err error) {
	ct := ""
	db_view(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("team"))
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
		item = Team{id, ct}
		return item, nil
	}
	return item, nil
}

func TeamExists(id string) (exists bool, err error) {
	exists = false
	db_view(func(tx *bolt.Tx) error {
		c := tx.Bucket([]byte("team")).Cursor()
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

func TeamSave(id string, ct string) (item Team, err error) {
	item = Team{id, ct}
	return item, item.Save()
}

func TeamRemove(team_id string) (err error) {
	team := Team{team_id, ""}
	return team.Remove()
}
