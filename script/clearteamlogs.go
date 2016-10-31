package main

import (
	// "net/http"
	// "fmt"
	// "log"
	"flag"
	// "golang.org/x/net/http2"
	// "fmt"
	// "errors"
	"github.com/boltdb/bolt"
	// "bytes"
)

var team_id *string = flag.String("t", "", "Team ID")

func clear_verification() error {
	db, err := bolt.Open("/var/lib/teambo/teams/"+*team_id+".db", 0644, nil)
	if err != nil {
		return err
	}
	defer db.Close()
	db.Update(func(tx *bolt.Tx) error {
		c := tx.Bucket([]byte("log")).Cursor()
		prefix := []byte("")
		for k, _ := c.Seek(prefix); len(k) > 0; k, _ = c.Next() {
			c.Delete()
		}
		return nil
	})
	return nil
}

func main() {
	flag.Parse()
	clear_verification()
}
