package main

import (
	"../util"
	"os"
	"flag"
	"github.com/syndtr/goleveldb/leveldb"
	"log"
)

var db *leveldb.DB

var db_path *string = flag.String("d", "", "Database Path")
var prefix *string = flag.String("p", "", "Prefix")

func list_keys() error {
	// r := ldb_util.BytesPrefix([]byte(*prefix))
	iter := db.NewIterator(nil, nil)
	for iter.Next() {
		log.Println(string(iter.Key()) + ": " + string(iter.Value()))
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
	util.Config.Parse(*config_path)
	path := util.Config.Get("app.data")+"/" + *db_path + ".ldb"
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
	log.Println("=== Listing from " + path + " ===")
	if *prefix != "" {
		log.Println("=== With Prefix " + *prefix + " ===")
	}
	list_keys()
	db.Close()
}
