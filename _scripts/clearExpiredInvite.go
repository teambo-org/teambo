package main

import (
	"fmt"
	"strconv"
	"github.com/boltdb/bolt"
	"time"
)

func clear_expired_invites() error {
	db, err := bolt.Open("/var/lib/teambo/invite.db", 0644, nil)
	if err != nil {
		return err
	}
	defer db.Close()
	now := strconv.Itoa(int(time.Now().UnixNano()))
	n := 0
	d := 0
	db.Update(func(tx *bolt.Tx) error {
		c := tx.Bucket([]byte("invite")).Cursor()
		prefix := []byte("")
		for k, v := c.Seek(prefix); len(k) > 0; k, _ = c.Next() {
			if now > string(v) {
				c.Delete()
				d = d + 1
			}
			n = n + 1
		}
		return nil
	})
	fmt.Println(strconv.Itoa(n) + " objects checked")
	fmt.Println(strconv.Itoa(d) + " objects deleted")
	return nil
}

func main() {
	clear_expired_invites()
}
