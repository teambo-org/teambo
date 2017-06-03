package model

import (
	"../util"
	"./driver"
	"github.com/boltdb/bolt"
	"strconv"
	"time"
	"os"
)

var db_acct driver.DB
var db_invite driver.DB
var db_throttle driver.DB
var db_newsletter driver.DB

func GlobalInit() (err error) {
	db_acct, err = driver.OpenLevelDB(util.Config("app.data")+"/account.ldb")
	if err != nil {
		return err
	}
	db_invite, err = driver.OpenLevelDB(util.Config("app.data")+"/invite.ldb")
	if err != nil {
		return err
	}
	db_throttle, err = driver.OpenLevelDB(util.Config("app.data")+"/throttle.ldb")
	if err != nil {
		return err
	}
	db_newsletter, err = driver.OpenLevelDB(util.Config("app.data")+"/newsletter.ldb")
	if err != nil {
		return err
	}
	return nil
}

func CloseAll() (err error) {
	err = db_acct.Close()
	err = db_invite.Close()
	err = db_throttle.Close()
	return err
}

func PurgeExpired(db driver.DB, prefix string) (ids []string, err error) {
	now := strconv.Itoa(int(time.Now().UnixNano()))
	iter := db.RangeIterator(prefix + "_expires-", prefix + "_expires-" + now)
	batch := db.Batch()
	for iter.Next() {
		id := string(iter.Value())
		key := string(iter.Key())
		ids = append(ids, id)
		batch.Delete(prefix + "-" + id)
		batch.Delete(key)
	}
	iter.Release()
	err = iter.Error()
	if err == nil {
		err = batch.Write()
	}
	return ids, err
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
