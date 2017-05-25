package model

import (
	"../util"
	// "bytes"
	"fmt"
	"github.com/boltdb/bolt"
	"log"
	"time"
)

type Team struct {
	Id         string `json:"id"`
	Ciphertext string `json:"ct"`
}

func (t Team) Save() (err error) {
	db_team_update(t.Id, func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte("settings"))
		if err != nil {
			log.Println(err)
			return err
		}
		err = b.Put([]byte("team"), []byte(t.Ciphertext))
		return err
	})
	if err != nil {
		return err
	}
	return nil
}

func (t Team) Remove() (err error) {
	err = db_team_delete(t.Id)
	if err != nil {
		log.Println(err)
		return err
	}
	return nil
}

func (t Team) NewMemberKey() TeamObject {
	member_keys := TeamBucket{t.Id, "member_key"}
	return member_keys.NewObject("")
}

func (t Team) NewMember() TeamObject {
	members := TeamBucket{t.Id, "member"}
	return members.NewObject("")
}

func (t Team) NewAdmin(mkey string) TeamObject {
	admins := TeamBucket{t.Id, "member_admin"}
	admin := admins.NewObject("")
	admin.Id = mkey
	return admin
}

func (t Team) IsAdmin(mkey string) bool {
	member_admin := TeamBucket{t.Id, "member_admin"}
	exists, err := member_admin.Exists(mkey)
	if err == nil && exists {
		return true
	}
	return false
}

func (t Team) GetMemberId(mkey string) string {
	member_keys := TeamBucket{t.Id, "member_key"}
	member_key, err := member_keys.Find(mkey)
	if err == nil && member_key.Ciphertext != "" {
		return member_key.Ciphertext
	}
	return ""
}

func (t Team) InviteCreate(ikey string) (invite TeamObject) {
	invites := TeamBucket{t.Id, "member_invite"}
	invite = invites.NewObject("")
	invite.Id = ikey
	return invite
}

func (t Team) InviteFind(ikey string) (invite TeamObject, err error) {
	invites := TeamBucket{t.Id, "member_invite"}
	invite, err = invites.Find(ikey)
	return invites.Find(ikey)
}

func (t Team) InviteResponseCreate(ikey string, pubKey string) (inviteResponse TeamObject) {
	invites := TeamBucket{t.Id, "member_invite_response"}
	inviteResponse = invites.NewObject("")
	inviteResponse.Id = ikey
	inviteResponse.Ciphertext = pubKey
	return inviteResponse
}

func (t Team) InviteResponseFind(ikey string) (inviteResponse TeamObject, err error) {
	invites := TeamBucket{t.Id, "member_invite_response"}
	inviteResponse, err = invites.Find(ikey)
	return inviteResponse, err
}

func (t Team) Log(iv string) (item string, err error) {
	db_team_update(t.Id, func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte("log"))
		ts := time.Now().UnixNano()
		k := fmt.Sprintf("%d-%s-%s", ts, "team", t.Id)
		err = b.Put([]byte(k), []byte(iv))
		if err != nil {
			return err
		}
		item = k + "-" + iv
		return nil
	})
	if err != nil {
		log.Println(err)
		return item, err
	}
	return item, nil
}

func NewTeam() Team {
	id := util.RandStr(8)
	for {
		if TeamExists(id) {
			id = util.RandStr(8)
		} else {
			break
		}
	}
	return Team{id, "new"}
}

func FindTeam(id string) (item Team, err error) {
	ct := ""
	db_team_view(id, func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("settings"))
		if b == nil {
			return nil
		}
		v := b.Get([]byte("team"))
		if err != nil {
			return err
		}
		ct = string(v)
		return nil
	})
	if err != nil {
		return item, err
	}

	if ct != "" {
		item = Team{id, ct}
		return item, nil
	}
	return item, nil
}

func TeamExists(id string) bool {
	return db_team_exists(id)
}

func TeamSave(id string, ct string) (item Team, err error) {
	item = Team{id, ct}
	return item, item.Save()
}

func TeamRemove(team_id string) (err error) {
	team := Team{team_id, ""}
	return team.Remove()
}
