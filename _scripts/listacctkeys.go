package main

import (
	"flag"
	"github.com/syndtr/goleveldb/leveldb"
	"../util"
	"log"
)

var db *leveldb.DB

func list_keys() error {
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
	util.ParseConfig(*config_path)

	path := util.Config("app.data")+"/account.ldb"
	log.Println("=== " + path + " ===")
	dbh, err := leveldb.OpenFile(path, nil)
	db = dbh
	if err != nil {
		log.Println(err)
		return
	}
	err = list_keys()
	if err != nil {
		log.Println(err)
		return
	}
	db.Close()
}
