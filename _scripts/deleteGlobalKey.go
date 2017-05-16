package main

import (
	"fmt"
	"flag"
	"github.com/boltdb/bolt"
	"strconv"
)

var bucket *string = flag.String("b", "", "Bucket")
var key *string = flag.String("k", "", "Key Prefix")


func clear_bucket() error {
	db, err := bolt.Open("/var/lib/teambo/global.db", 0644, nil)
	if err != nil {
		return err
	}
	defer db.Close()
	db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(*bucket))
		if b == nil {
			fmt.Println("Unknown bucket " + *bucket)
			return nil
		}
		c := b.Cursor()
		n := 0
		prefix := []byte(*key)
		for k, _ := c.Seek(prefix); len(k) > 0; k, _ = c.Next() {
			c.Delete()
			n = n + 1
		}
		fmt.Println("Deleted " + strconv.Itoa(n) + " objects")
		return nil
	})
	return nil
}

func main() {
	flag.Parse()
	if(*key != "") {
		clear_bucket()
	}
}
