package main

import (
	"flag"
	"fmt"
	"github.com/boltdb/bolt"
)

var team_id *string = flag.String("t", "", "Team ID")
var from *string = flag.String("from", "", "From bucket name")
var to *string = flag.String("to", "", "To bucket name")

func moveBucket() error {
	db, err := bolt.Open("/var/lib/teambo/teams/"+*team_id+".db", 0644, nil)
	if err != nil {
		return err
	}
	defer db.Close()
	db.Update(func(tx *bolt.Tx) error {
		a := tx.Bucket([]byte(*from))
		b, _ := tx.CreateBucketIfNotExists([]byte(*to))
		fmt.Println("--- Copying objects from " + *from + " to " + *to + " ---")
		a.ForEach(func(k, v []byte) error {
			fmt.Println(string(k))
			b.Put(k, v)
			return nil
		})
		return nil
	})
	return nil
}

func main() {
	flag.Parse()
	moveBucket()
}
