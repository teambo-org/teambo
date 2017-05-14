package model

import (
	"fmt"
	"github.com/boltdb/bolt"
	"strings"
)

func TeamLogSince(team_id string, ts string) (ret []string, err error) {
	db_team_view(team_id, func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("log"))
		if b == nil {
			return nil
		}
		c := b.Cursor()

		from := []byte(ts)
		for k, v := c.Seek(from); k != nil; k, v = c.Next() {
			ret = append(ret, string(k)+"-"+string(v))
		}
		return nil
	})
	if err != nil {
		fmt.Println(err)
		return ret, err
	}
	return ret, nil
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
