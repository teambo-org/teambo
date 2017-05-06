package main

import (
	"fmt"
	"flag"
	"github.com/boltdb/bolt"
	"strconv"
)

var team_id *string = flag.String("t", "", "Team ID")
var bucket *string = flag.String("b", "", "Bucket")

func clear_bucket() error {
	db, err := bolt.Open("/var/lib/teambo/teams/"+*team_id+".db", 0644, nil)
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
		prefix := []byte("")
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
	clear_bucket()
}
