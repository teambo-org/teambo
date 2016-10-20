package main

import (
	"flag"
	"fmt"
	"github.com/boltdb/bolt"
)

var team_id *string = flag.String("t", "", "Team ID")

func list_buckets() error {
	db, err := bolt.Open("/var/lib/teambo/teams/"+*team_id+".db", 0644, nil)
	if err != nil {
		return err
	}
	defer db.Close()

	fmt.Println("--- buckets ---")
	err = db.View(func(tx *bolt.Tx) error {
		return tx.ForEach(func(name []byte, _ *bolt.Bucket) error {
			fmt.Println(string(name))
			return nil
		})
	})
	return nil
}

func list_keys(bucket_name string) error {
	db, err := bolt.Open("/var/lib/teambo/teams/"+*team_id+".db", 0644, nil)
	if err != nil {
		return err
	}
	defer db.Close()
	db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(bucket_name)).Cursor()
		fmt.Println("--- " + bucket_name + " ---")
		prefix := []byte("")
		for k, v := b.Seek(prefix); len(k) > 0; k, v = b.Next() {
			fmt.Println(string(k))
			fmt.Println(string(v))
		}
		return nil
	})
	return nil
}

func main() {
	flag.Parse()
	fmt.Println("--- team ---")
	fmt.Println("/var/lib/teambo/teams/" + *team_id + ".db")
	list_buckets()
	list_keys("bucket")
	list_keys("item")
	list_keys("member")
	// list_keys("xz6tg5pF")
}
