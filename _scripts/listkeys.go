package main

import (
	// "net/http"
	"fmt"
	// "log"
	// "flag"
	// "golang.org/x/net/http2"
	// "fmt"
	// "errors"
	"github.com/boltdb/bolt"
	// "bytes"
)

func list_keys(bucket_name string) error {
	db, err := bolt.Open("/var/lib/teambo/global.db", 0644, nil)
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
	list_keys("acct")
	list_keys("verification")
	list_keys("team")
}
