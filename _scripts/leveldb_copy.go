package main

import (
	"fmt"
	"flag"
	"github.com/boltdb/bolt"
	"github.com/syndtr/goleveldb/leveldb"
	"bytes"
	// "log"
)

var from *string = flag.String("f", "", "From")
var to *string = flag.String("t", "", "To")

func list_buckets() (buckets []string, err error) {
	db, err := bolt.Open(*from, 0644, nil)
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

func copy_keys(bucket_name string) error {
	db, err := bolt.Open(*from, 0644, nil)
	if err != nil {
		fmt.Println(err)
		return err
	}
	defer db.Close()
	level_db, err := leveldb.OpenFile(*to, nil)
	if err != nil {
		fmt.Println(err)
		return err
	}
	defer level_db.Close()
	db.View(func(tx *bolt.Tx) error {
		fmt.Println("--- " + bucket_name + " ---")
		b := tx.Bucket([]byte(bucket_name))
		if b == nil {
			fmt.Println("[EMPTY]")
			return nil
		}
		c := b.Cursor()
		prefix := []byte("")
		batch := new(leveldb.Batch)
		for k, v := c.Seek(prefix); bytes.HasPrefix(k, prefix) && len(v) > 0; k, v = c.Next() {
			fmt.Println(string(k) + ": " + bucket_name + "-" + string(k))
			batch.Put([]byte(bucket_name + "-" + string(k)), v)
		}
		err = level_db.Write(batch, nil)
		if err != nil {
			fmt.Println(err)
		}
		return nil
	})
	return nil
}

func main() {
	flag.Parse()
	fmt.Println("--- COPYING ---")
	fmt.Println("FROM " + *from)
	fmt.Println("TO " + *to)
	buckets, err := list_buckets()
	if err != nil {
		fmt.Println(err)
		return
	}
	for _, bucket_name := range buckets {
		copy_keys(bucket_name)
	}
}
