package main

import (
	"flag"
	"log"
	"strconv"

	"github.com/syndtr/goleveldb/leveldb"

	"github.com/teambo-org/teambo/util"
)

var db_invite *leveldb.DB

func clear_invites() error {
	total := 0
	iter := db_invite.NewIterator(nil, nil)
	for iter.Next() {
		db_invite.Delete(iter.Key(), nil)
		total++
	}
	log.Println("Deleted " + strconv.Itoa(total) + " records")
	iter.Release()
	return iter.Error()
}

func main() {
	var config_path *string = flag.String("conf", "./app.conf", "Location of config file")
	flag.Parse()
	util.Config.Parse(*config_path)
	path := util.Config.Get("app.data")+"/invite.ldb"
	log.Println("=== " + path + " ===")
	dbh, err := leveldb.OpenFile(path, nil)
	db_invite = dbh
	if err != nil {
		log.Println(err)
		return
	}
	err = clear_invites()
	if err != nil {
		log.Println(err)
		return
	}
	db_invite.Close()
}
