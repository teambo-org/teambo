package main

import (
	"../util"
	"flag"
	"github.com/syndtr/goleveldb/leveldb"
	ldb_util "github.com/syndtr/goleveldb/leveldb/util"
	"strings"
	"log"
)

var db_auth *leveldb.DB
var db_acct *leveldb.DB

var dry *string = flag.String("dry", "true", "Dry Run")
var config_path *string = flag.String("conf", "../app.conf", "Location of config file")

func fix_auth() error {
	if *dry != "false" {
		log.Println("Dry Run")
	}
	r := ldb_util.BytesPrefix([]byte("acct-"))
	iter := db_acct.NewIterator(r, nil)
	for iter.Next() {
		parts := strings.Split(string(iter.Key()), "-")
		hkey := parts[1]
		if len(hkey) == 16 {
			log.Println("skipping: " + hkey)
			continue;
		}
		ct := iter.Value()
		acctId := newAcctId()
		protection, _ := db_acct.Get([]byte("acct_protection-" + hkey), nil)
		if *dry != "false" {
			log.Println(hkey + ": " + acctId)
			log.Println("protection: " + string(protection))
		} else {
			db_acct.Put([]byte("acct-" + acctId), ct, nil)
			db_auth.Put([]byte("auth-" + hkey), []byte(acctId), nil)
			db_auth.Put([]byte("protection-" + hkey), protection, nil)
			db_acct.Delete([]byte("acct-" + hkey), nil)
			db_acct.Delete([]byte("acct_protection-" + hkey), nil)
			log.Println(hkey + ": " + acctId)
		}
	}
	iter.Release()
	return iter.Error()
}

func newAcctId() string {
	id := util.RandStr(16)
	for {
		exists, _ := db_acct.Has([]byte("acct-" + id), nil)
		if exists {
			id = util.RandStr(16)
		} else {
			break
		}
	}
	return id
}

func main() {
	flag.Parse()
	util.ParseConfig(*config_path)
	var err error
	db_auth, err = leveldb.OpenFile(util.Config("app.data") + "/auth.ldb", nil)
	defer db_auth.Close()
	db_acct, err = leveldb.OpenFile(util.Config("app.data") + "/account.ldb", nil)
	defer db_acct.Close()
	if err != nil {
		log.Println(err)
		return
	}
	fix_auth()
}
