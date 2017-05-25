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
	fmt.Println("Deleted " + strconv.Itoa(n) + " invites")
	n = 0
	db.Update(func(tx *bolt.Tx) error {
		c := tx.Bucket([]byte("invite_response")).Cursor()
		prefix := []byte("")
		for k, _ := c.Seek(prefix); len(k) > 0; k, _ = c.Next() {
			c.Delete()
			n = n + 1
		}
		return nil
	})
	fmt.Println("Deleted " + strconv.Itoa(n) + " invite responses")
	n = 0
	db.Update(func(tx *bolt.Tx) error {
		c := tx.Bucket([]byte("invite_acceptance")).Cursor()
		prefix := []byte("")
		for k, _ := c.Seek(prefix); len(k) > 0; k, _ = c.Next() {
			c.Delete()
			n = n + 1
		}
		return nil
	})
	fmt.Println("Deleted " + strconv.Itoa(n) + " invite acceptances")
	n = 0
	db.Update(func(tx *bolt.Tx) error {
		c := tx.Bucket([]byte("invite_redeemed")).Cursor()
		prefix := []byte("")
		for k, _ := c.Seek(prefix); len(k) > 0; k, _ = c.Next() {
			c.Delete()
			n = n + 1
		}
		return nil
	})
	fmt.Println("Deleted " + strconv.Itoa(n) + " from invite_redeemed")
	n = 0
	db.Update(func(tx *bolt.Tx) error {
		c := tx.Bucket([]byte("invite_expire")).Cursor()
		prefix := []byte("")
		for k, _ := c.Seek(prefix); len(k) > 0; k, _ = c.Next() {
			c.Delete()
			n = n + 1
		}
		return nil
	})
	fmt.Println("Deleted " + strconv.Itoa(n) + " from invite_expire")
	return nil
}

func main() {
	clear_invites()
}
