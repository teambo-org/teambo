package model

import (
	"../util"
	"./driver"
	"strconv"
	"time"
	"os"
	"strings"
	// "log"
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
	TeamDBPool.Init()
	return nil
}

func CloseAll() (err error) {
	db_acct.Close()
	db_invite.Close()
	db_throttle.Close()
	db_newsletter.Close()
	TeamDBPool.CloseAll()
	return err
}

func PurgeExpired(db driver.DB, prefix string) (ids []string, err error) {
	now := strconv.Itoa(int(time.Now().UnixNano()))
	iter := db.RangeIterator(prefix + "_expires-", prefix + "_expires-" + now)
	batch := db.Batch()
	for iter.Next() {
		id := string(iter.Value())
		key := string(iter.Key())
		ts := strings.Split(key, "-")[1]
		ids = append(ids, id)
		batch.Delete(prefix + "-" + id + "-" + ts)
		batch.Delete(key)
	}
	iter.Release()
	err = iter.Error()
	if err == nil {
		err = batch.Write()
	}
	return ids, err
}

func db_open(path string) (db driver.DB, err error) {
	return driver.OpenLevelDB(path)
}

func db_open_existing(path string) (db driver.DB, err error) {
	if _, err := os.Stat(path); err == nil {
		db, err = driver.OpenLevelDB(path)
	}
	return db, err
}

func db_team_open(team_id string) (db driver.DB, err error) {
	return db_open(util.Config("app.data") + "/teams/" + team_id + ".ldb")
}

func db_team_delete(team_id string) error {
	err := os.RemoveAll(util.Config("app.data") + "/teams/" + team_id + ".ldb")
	if err != nil {
		return err
	}
	return nil
}

func db_team_exists(team_id string) bool {
	if _, err := os.Stat(util.Config("app.data") + "/teams/" + team_id + ".ldb"); err == nil {
		return true
	}
	return false
}
