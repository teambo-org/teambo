package main

import (
	"flag"
	"log"

	"github.com/syndtr/goleveldb/leveldb"

	"github.com/teambo-org/teambo/util"
)

var db *leveldb.DB

var db_path *string = flag.String("d", "", "Database Path")
var key *string = flag.String("k", "", "Key")

func insert_beta_code() error {
	return db.Delete([]byte(*key), nil)
}

func main() {
	var config_path *string = flag.String("conf", "./app.conf", "Location of config file")
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
	log.Println("=== Deleting from " + path + " ===")
	log.Println(*key)
	insert_beta_code()
	db.Close()
}
