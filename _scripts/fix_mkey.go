package main

import (
	"../util"
	"flag"
	"github.com/syndtr/goleveldb/leveldb"
	ldb_util "github.com/syndtr/goleveldb/leveldb/util"
	"strings"
	"os"
	"log"
)

var db *leveldb.DB

var db_path *string = flag.String("d", "", "Database Path")

func fix_mkey() error {
	r := ldb_util.BytesPrefix([]byte("member_key"))
	iter := db.NewIterator(r, nil)
	for iter.Next() {
		parts := strings.Split(string(iter.Key()), "-")
		prefix := parts[0]
		mkey := parts[1]
		mid := string(iter.Value())
		db.Delete(iter.Key(), nil)
		db.Put([]byte(prefix + "-" + mid), []byte(mkey), nil)
		log.Println(mid + ": " + mkey)
	}
	iter.Release()
	r = ldb_util.BytesPrefix([]byte("member_admin"))
	iter = db.NewIterator(r, nil)
	for iter.Next() {
		parts := strings.Split(string(iter.Key()), "-")
		prefix := parts[0]
		mkey := parts[1]
		mid := string(iter.Value())
		db.Delete(iter.Key(), nil)
		db.Put([]byte(prefix + "-" + mid), []byte(mkey), nil)
		log.Println(mid + ": " + mkey)
	}
	iter.Release()
	return iter.Error()
}

func main() {
	var config_path *string = flag.String("conf", "../app.conf", "Location of config file")
	flag.Parse()
	if *db_path == "" {
		log.Println("Database Path Required")
		return
	}
	util.ParseConfig(*config_path)
	path := util.Config("app.data") + "/" + *db_path + ".ldb"
	if _, err := os.Stat(path); err != nil {
		log.Println("Database not found: " + path)
		return
	}
	dbh, err := leveldb.OpenFile(path, nil)
	db = dbh
	if err != nil {
		log.Println(err)
		return
	}
	log.Println("=== Fixing mkey for " + path + " ===")
	fix_mkey()
	db.Close()
}
