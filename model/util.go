package model

import (
	"../util"
	"github.com/boltdb/bolt"
	"github.com/syndtr/goleveldb/leveldb"
	"github.com/syndtr/goleveldb/leveldb/iterator"
	"github.com/syndtr/goleveldb/leveldb/errors"
	ldb_util "github.com/syndtr/goleveldb/leveldb/util"
	"strconv"
	"time"
	"os"
)

var db_acct *ldb_wrapper
var db_invite *ldb_wrapper
var db_throttle *ldb_wrapper

type ldb_wrapper struct {
	db *leveldb.DB
}

func (w *ldb_wrapper) Get(key []byte) ([]byte, error) {
	v, err := w.db.Get(key, nil)
	if err == errors.ErrNotFound  {
		return v, nil
	}
	return v, err
}
func (w *ldb_wrapper) Put(key, value []byte) error {
	return w.db.Put(key, value, nil)
}
func (w *ldb_wrapper) Delete(key []byte) error {
	return w.db.Delete(key, nil)
}
func (w *ldb_wrapper) Has(key []byte) (bool, error) {
	return w.db.Has(key, nil)
}
func (w *ldb_wrapper) Close() error {
	return w.db.Close()
}
func (w *ldb_wrapper) Write(batch *leveldb.Batch) error {
	return w.db.Write(batch, nil)
}
func (w *ldb_wrapper) NewIterator(r *ldb_util.Range) (iterator.Iterator) {
	return w.db.NewIterator(r, nil)
}
func (w *ldb_wrapper) Batch() *leveldb.Batch {
	return new(leveldb.Batch)
}
func (w *ldb_wrapper) PrefixIterator(prefix []byte) (iterator.Iterator) {
	return w.db.NewIterator(ldb_util.BytesPrefix(prefix), nil)
}
func (w *ldb_wrapper) RangeIterator(start, limit []byte) (iterator.Iterator) {
	return w.db.NewIterator(&ldb_util.Range{Start: start, Limit: limit}, nil)
}

func GlobalInit() error {
	dbh, err := leveldb.OpenFile(util.Config("app.data")+"/account.ldb", nil)
	if err != nil {
		return err
	}
	db_acct = &ldb_wrapper{dbh}
	dbh, err = leveldb.OpenFile(util.Config("app.data")+"/invite.ldb", nil)
	if err != nil {
		return err
	}
	db_invite = &ldb_wrapper{dbh}
	dbh, err = leveldb.OpenFile(util.Config("app.data")+"/throttle.ldb", nil)
	if err != nil {
		return err
	}
	db_throttle = &ldb_wrapper{dbh}
	return nil
}

func CloseAll() (err error) {
	err = db_acct.Close()
	err = db_invite.Close()
	err = db_throttle.Close()
	return err
}

func PurgeExpired(db *ldb_wrapper, prefix string) (ids []string, err error) {
	now := strconv.Itoa(int(time.Now().UnixNano()))
	iter := db.RangeIterator([]byte(prefix + "_expires-"), []byte(prefix + "_expires-" + now))
	batch := new(leveldb.Batch)
	for iter.Next() {
		id := string(iter.Value())
		ids = append(ids, id)
		batch.Delete([]byte(prefix + "-" + id))
		batch.Delete(iter.Key())
	}
	iter.Release()
	err = iter.Error()
	if err == nil {
		err = db.Write(batch)
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
