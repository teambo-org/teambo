package model

import (
	"fmt"
	"github.com/boltdb/bolt"
	"strings"
	// "log"
)

func TeamLogSince(team_id string, ts string) (ret []string, err error) {
	db_team_view(team_id, func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("log"))
		if b == nil {
			return nil
		}
		c := b.Cursor()
		first := true
		for k, v := c.Seek([]byte(ts)); k != nil; k, v = c.Next() {
			if !first || !strings.HasPrefix(string(k), ts)  {
				ret = append(ret, string(k)+"-"+string(v))
			} else {
				first = false
			}
		}
		return nil
	})
	if err != nil {
		fmt.Println(err)
		return ret, err
	}
	return ret, nil
}

func TeamLogCount(team_id string, ts string) (n int64) {
	n = 0
	db_team_view(team_id, func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("log"))
		if b == nil {
			return nil
		}
		c := b.Cursor()
		first := true
		for k, _ := c.Seek([]byte(ts)); k != nil; k, _ = c.Next() {
			if !first || !strings.HasPrefix(string(k), ts) {
				n = n + 1
			} else {
				first = false
			}
		}
		return nil
	})
	return n
}

func TeamLogParse(logs []string) (ret []map[string]interface{}) {
	for _, log := range logs {
		parts := strings.Split(log, "-")
		ret = append(ret, map[string]interface{}{
			"type":  "log",
			"ts":    parts[0],
			"model": parts[1],
			"id":    parts[2],
			"iv":    parts[3],
		})
	}
	return ret
}
