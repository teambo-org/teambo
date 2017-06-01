package main

import (
	"flag"
	"github.com/syndtr/goleveldb/leveldb"
	"../util"
	"log"
)

var db *leveldb.DB

var db_path *string = flag.String("d", "", "Database Path")
var key *string = flag.String("k", "", "Key")

func insert_beta_code() error {
	return db.Delete([]byte(*key), nil)
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
	dbh, err := leveldb.OpenFile(path, nil)
	db = dbh
	if err != nil {
		log.Println(err)
		return
	}
	log.Println("=== Deleting from " + path + " ===")
	log.Println(*key)
	insert_beta_code()
	db.Close()
}
