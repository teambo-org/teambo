package main

import (
	"flag"
	"log"
	"fmt"
	"time"

	"github.com/syndtr/goleveldb/leveldb"

	"github.com/teambo-org/teambo/util"
)

var db *leveldb.DB

var code *string = flag.String("c", "", "Code")

func insert_beta_code() {
	exp := fmt.Sprintf("%d", time.Now().Add(72 * time.Hour).UnixNano())
	db.Put([]byte("beta_code-" + *code), []byte(exp), nil)
	db.Put([]byte("beta_code_expires-" + exp), []byte(*code), nil)
	return
}

func main() {
	var config_path *string = flag.String("conf", "./app.conf", "Location of config file")
	flag.Parse()
	if *code == "" {
		log.Println("Code Required")
		return
	}
	util.Config.Parse(*config_path)
	path := util.Config.Get("app.data")+"/invite.ldb"
	log.Println("=== Inserting beta code ===")
	log.Println(*code)
	dbh, err := leveldb.OpenFile(path, nil)
	db = dbh
	if err != nil {
		log.Println(err)
		return
	}
	insert_beta_code()
	db.Close()
}
