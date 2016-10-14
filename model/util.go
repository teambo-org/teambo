package model

import (
	"github.com/boltdb/bolt"
    "../util"
)

func GlobalInit() error {
	err := db_update(func(tx *bolt.Tx) error {
		tx.CreateBucketIfNotExists([]byte("acct"))
		tx.CreateBucketIfNotExists([]byte("verification"))
		tx.CreateBucketIfNotExists([]byte("team"))
		// tx.CreateBucketIfNotExists([]byte("invite"))
		return nil
	})
	return err
}

func db_update(fn func(*bolt.Tx) error) error {
	db, err := bolt.Open(util.Config("app.data")+"/global.db", 0644, nil)
	if err != nil {
		return err
	}
	defer db.Close()
	return db.Update(fn)
}

func db_view(fn func(*bolt.Tx) error) error {
	db, err := bolt.Open(util.Config("app.data")+"/global.db", 0644, nil)
	if err != nil {
		return err
	}
	defer db.Close()
	return db.View(fn)
}

func db_team_update(team_id string, fn func(*bolt.Tx) error) error {
	db, err := bolt.Open(util.Config("app.data")+"/teams/"+team_id+".db", 0644, nil)
	if err != nil {
		return err
	}
	defer db.Close()
	return db.Update(fn)
}

func db_team_view(team_id string, fn func(*bolt.Tx) error) error {
	db, err := bolt.Open(util.Config("app.data")+"/teams/"+team_id+".db", 0644, nil)
	if err != nil {
		return err
	}
	defer db.Close()
	return db.View(fn)
}
