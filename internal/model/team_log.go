package model

import (
	"strings"
	// "log"
)

func TeamLogSince(team_id string, ts string) (ret []string, err error) {
	team_db, err := TeamDBPool.Find(team_id)
	if err != nil {
		return ret, err
	}
	first := true
	prefix := "log-"
	iter := team_db.PrefixIterator(prefix)
	iter.Seek(prefix + ts)
	for iter.Next() {
		if !first || !strings.HasPrefix(iter.Key(), prefix+ts) {
			ret = append(ret, iter.Key()[len(prefix):]+"-"+iter.Value())
		}
		first = false
	}
	iter.Release()
	return ret, iter.Error()
}

func TeamLogCount(team_id string, ts string) (total int64) {
	total = 0
	team_db, err := TeamDBPool.Find(team_id)
	if err != nil {
		return total
	}
	first := true
	prefix := "log-"
	iter := team_db.PrefixIterator(prefix)
	iter.Seek(prefix + ts)
	for iter.Next() {
		if !first || !strings.HasPrefix(iter.Key(), prefix+ts) {
			total++
		}
		first = false
	}
	iter.Release()
	return total
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
