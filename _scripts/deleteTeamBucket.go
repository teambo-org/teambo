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
var bucket *string = flag.String("b", "", "Bucket")

func delete_bucket() error {
	db, err := bolt.Open("/var/lib/teambo/teams/"+*team_id+".db", 0644, nil)
	if err != nil {
		return err
	}
	defer db.Close()
	db.Update(func(tx *bolt.Tx) error {
		c := tx.DeleteBucket([]byte(*bucket))
		return nil
	})
	return nil
}

func main() {
	flag.Parse()
	delete_bucket()
}
