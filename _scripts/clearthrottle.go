package main

import (
	"flag"
	"github.com/syndtr/goleveldb/leveldb"
	"../util"
	"log"
	"strconv"
)

var db *leveldb.DB

func clear_invites() error {
	total := 0
	iter := db.NewIterator(nil, nil)
	for iter.Next() {
		db.Delete(iter.Key(), nil)
		total++
	}
	log.Println("Deleted " + strconv.Itoa(total) + " records")
	iter.Release()
	return iter.Error()
}

func main() {
	var config_path *string = flag.String("conf", "../app.conf", "Location of config file")
	flag.Parse()
	util.ParseConfig(*config_path)
	path := util.Config("app.data")+"/throttle.ldb"
	log.Println("=== " + path + " ===")
	dbh, err := leveldb.OpenFile(path, nil)
	db = dbh
	if err != nil {
		log.Println(err)
		return
	}
	err = clear_invites()
	if err != nil {
		log.Println(err)
		return
	}
	db.Close()
}
