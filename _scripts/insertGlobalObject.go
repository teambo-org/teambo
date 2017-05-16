package main

import (
	"fmt"
	"flag"
	"github.com/boltdb/bolt"
	// "strconv"
)

var bucket *string = flag.String("b", "", "Bucket")
var key *string = flag.String("k", "", "Key")
var value *string = flag.String("v", "", "Value")

func create_object() error {
	db, err := bolt.Open("/var/lib/teambo/global.db", 0644, nil)
	if err != nil {
		return err
	}
	defer db.Close()
	db.Update(func(tx *bolt.Tx) (err error) {
		b, err := tx.CreateBucketIfNotExists([]byte(*bucket))
		if err != nil {
			fmt.Println("Could not open bucket " + *bucket)
			return nil
		}
		err = b.Put([]byte(*key), []byte(*value))
		if err != nil {
			fmt.Println("Error inserting object")
			return err
		}
		return nil
	})
	return nil
}

func main() {
	flag.Parse()
	create_object()
}
