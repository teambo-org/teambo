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
)

func list_keys(bucket_name string) {
    db, err := bolt.Open("/var/lib/teambo/global.db", 0644, nil)
    if err != nil { return err }
    defer db.Close()
	b := tx.Bucket([]byte(bucket_name)).Cursor()
	fmt.Println(bucket_name)
	prefix := []byte("")
	for k, _ := b.Seek(prefix); bytes.HasPrefix(k, prefix); k, _ = b.Next() {
		fmt.Println(k);
	}
}

func main() {
	list_keys("acct")
	list_keys("verification")
}
