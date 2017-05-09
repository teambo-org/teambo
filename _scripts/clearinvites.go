package main

import (
	"fmt"
	"strconv"
	"github.com/boltdb/bolt"
)

func clear_invites() error {
	db, err := bolt.Open("/var/lib/teambo/invite.db", 0644, nil)
	if err != nil {
		return err
	}
	defer db.Close()
	n := 0
	db.Update(func(tx *bolt.Tx) error {
		c := tx.Bucket([]byte("invite")).Cursor()
		prefix := []byte("")
		for k, _ := c.Seek(prefix); len(k) > 0; k, _ = c.Next() {
			c.Delete()
			n = n + 1
		}
		return nil
	})
	fmt.Println("Deleted " + strconv.Itoa(n) + " objects")
	return nil
}

func main() {
	clear_invites()
}
