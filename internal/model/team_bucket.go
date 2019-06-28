package model

import (
	// "log"

	"github.com/teambo-org/teambo/internal/util"
)

type TeamBucket struct {
	TeamId string
	Name   string
}

func (tb TeamBucket) NewObject(id string) TeamObject {
	if id == "" {
		id = util.RandStr(8)
	}
	for {
		exists, _ := tb.Exists(id)
		if exists {
			id = util.RandStr(8)
		} else {
			break
		}
	}
	return TeamObject{tb.TeamId, tb.Name, id, "new"}
}

func (tb TeamBucket) Find(id string) (o TeamObject, err error) {
	team_db, err := TeamDBPool.Find(tb.TeamId)
	if err != nil {
		return o, err
	}
	ct, err := team_db.Get(tb.Name + "-" + id)
	if ct != "" {
		o = TeamObject{tb.TeamId, tb.Name, id, ct}
	}
	return o, err
}

func (tb TeamBucket) All() (o []TeamObject, err error) {
	team_db, err := TeamDBPool.Find(tb.TeamId)
	if err != nil {
		return o, err
	}
	prefix := tb.Name + "-"
	iter := team_db.PrefixIterator(prefix)
	for iter.Next() {
		if iter.Value() == "new" {
			continue
		}
		id := iter.Key()[len(prefix):]
		o = append(o, TeamObject{tb.TeamId, tb.Name, id, iter.Value()})
	}
	iter.Release()
	return o, iter.Error()
}

func (tb TeamBucket) Exists(id string) (exists bool, err error) {
	team_db, err := TeamDBPool.Find(tb.TeamId)
	if err != nil {
		return exists, err
	}
	return team_db.Has(tb.Name + "-" + id)
}

func (tb TeamBucket) RemoveByValue(val string) (err error) {
	team_db, err := TeamDBPool.Find(tb.TeamId)
	if err != nil {
		return err
	}
	iter := team_db.PrefixIterator(tb.Name + "-")
	for iter.Next() {
		if iter.Value() == val {
			team_db.Delete(iter.Key())
		}
	}
	iter.Release()
	return iter.Error()
}

func (tb TeamBucket) Count() (total int) {
	total = 0
	team_db, err := TeamDBPool.Find(tb.TeamId)
	if err != nil {
		return total
	}
	iter := team_db.PrefixIterator(tb.Name + "-")
	for iter.Next() {
		total++
	}
	iter.Release()
	return total
}
