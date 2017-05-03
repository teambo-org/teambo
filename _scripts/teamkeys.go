package main

import (
	"flag"
	"fmt"
	"github.com/boltdb/bolt"
)

var team_id *string = flag.String("t", "", "Team ID")

func list_buckets() (buckets []string, err error) {
	db, err := bolt.Open("/var/lib/teambo/teams/"+*team_id+".db", 0644, nil)
	if err != nil {
		return nil, err
	}
	defer db.Close()

	fmt.Println("--- buckets ---")
	err = db.View(func(tx *bolt.Tx) error {
		return tx.ForEach(func(name []byte, _ *bolt.Bucket) error {
			fmt.Println(string(name))
			buckets = append(buckets, string(name))
			return nil
		})
	})
	return buckets, nil
}

func list_keys(bucket_name string) error {
	db, err := bolt.Open("/var/lib/teambo/teams/"+*team_id+".db", 0644, nil)
	if err != nil {
		return err
	}
	defer db.Close()
	db.View(func(tx *bolt.Tx) error {
		fmt.Println("--- " + bucket_name + " ---")
		b := tx.Bucket([]byte(bucket_name))
		if b == nil {
			fmt.Println("[EMPTY]")
			return nil
		}
		c := b.Cursor()
		prefix := []byte("")
		for k, v := c.Seek(prefix); len(k) > 0; k, v = c.Next() {
			fmt.Println(string(k) + ": " + string(v))
		}
		return nil
	})
	return nil
}

func main() {
	flag.Parse()
	fmt.Println("--- team ---")
	fmt.Println("/var/lib/teambo/teams/" + *team_id + ".db")
	buckets, err := list_buckets()
	if err != nil {
		fmt.Println(err)
		return
	}
	for _, bucket_name := range buckets {
		list_keys(bucket_name)
	}
}
