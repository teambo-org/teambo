package model

import (
	"../util"
	"github.com/boltdb/bolt"
	"os"
)

func GlobalInit() error {
	err := db_update(func(tx *bolt.Tx) error {
		tx.CreateBucketIfNotExists([]byte("acct"))
		tx.CreateBucketIfNotExists([]byte("acct_protection"))
		tx.CreateBucketIfNotExists([]byte("verification"))
		tx.CreateBucketIfNotExists([]byte("verification_expires"))
		tx.CreateBucketIfNotExists([]byte("beta_code"))
		tx.CreateBucketIfNotExists([]byte("beta_code_expires"))
		return nil
	})
	if err != nil {
		return err
	}
	err = db_invite_update(func(tx *bolt.Tx) error {
		tx.CreateBucketIfNotExists([]byte("invite"))
		tx.CreateBucketIfNotExists([]byte("invite_response"))
		tx.CreateBucketIfNotExists([]byte("invite_acceptance"))
		tx.CreateBucketIfNotExists([]byte("invite_redeemed"))
		tx.CreateBucketIfNotExists([]byte("invite_expire"))
		return nil
	})
	if err != nil {
		return err
	}
	return nil
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

func db_invite_update(fn func(*bolt.Tx) error) error {
	db, err := bolt.Open(util.Config("app.data")+"/invite.db", 0644, nil)
	if err != nil {
		return err
	}
	defer db.Close()
	return db.Update(fn)
}

func db_invite_view(fn func(*bolt.Tx) error) error {
	db, err := bolt.Open(util.Config("app.data")+"/invite.db", 0644, nil)
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
	var path = util.Config("app.data") + "/teams/" + team_id + ".db"
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return err
	}
	db, err := bolt.Open(path, 0644, nil)
	if err != nil {
		return err
	}
	defer db.Close()
	return db.View(fn)
}

func db_team_delete(team_id string) error {
	err := os.Remove(util.Config("app.data") + "/teams/" + team_id + ".db")
	if err != nil {
		return err
	}
	return nil
}

func db_team_exists(team_id string) bool {
	if _, err := os.Stat(util.Config("app.data") + "/teams/" + team_id + ".db"); err == nil {
		return true
	}
	return false
}
