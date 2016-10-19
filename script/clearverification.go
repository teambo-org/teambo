package main

import (
	// "net/http"
	// "fmt"
	// "log"
	// "flag"
	// "golang.org/x/net/http2"
	// "fmt"
	// "errors"
	"github.com/boltdb/bolt"
	// "bytes"
)

func clear_verification() error {
	db, err := bolt.Open("/var/lib/teambo/global.db", 0644, nil)
	if err != nil {
		return err
	}
	defer db.Close()
	db.Update(func(tx *bolt.Tx) error {
		c := tx.Bucket([]byte("verification")).Cursor()
		prefix := []byte("")
		for k, _ := c.Seek(prefix); len(k) > 0; k, _ = c.Next() {
			c.Delete()
		}
		return nil
	})
	return nil
}

func main() {
	clear_verification()
}
