package main

import (
	"flag"
	"github.com/syndtr/goleveldb/leveldb"
	"../util"
	"log"
)

var db_invite *leveldb.DB

func list_keys() error {
	iter := db_invite.NewIterator(nil, nil)
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

	path := util.Config("app.data")+"/invite.ldb"
	log.Println("=== " + path + " ===")
	dbh, err := leveldb.OpenFile(path, nil)
	db_invite = dbh
	if err != nil {
		log.Println(err)
		return
	}
	err = list_keys()
	if err != nil {
		log.Println(err)
		return
	}
	db_invite.Close()
}
