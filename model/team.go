package model

import (
	"../util"
	"fmt"
	"time"
	"log"
	"errors"
)

type Team struct {
	Id         string `json:"id"`
	Ciphertext string `json:"ct"`
}

func (t Team) Save() (err error) {
	team_db, err := TeamDBPool.Find(t.Id)
	if err == nil {
		err = team_db.Put("settings-team", t.Ciphertext)
	}
	return err
}

func (t Team) Remove() (err error) {
	TeamDBPool.Expire(t.Id)
	err = db_team_delete(t.Id)
	if err != nil {
		log.Println(err)
		return err
	}
	return nil
}

func (t Team) NewMemberKey(id string) (TeamObject, error) {
	member_key := TeamBucket{t.Id, "member_key"}
	exists, err := member_key.Exists(id)
	if err != nil {
		return TeamObject{}, errors.New("Could not read member key")
	}
	if exists {
		return TeamObject{}, errors.New("Member already has a key")
	}
	mkey := util.RandStr(16)
	return TeamObject{t.Id, "member_key", id, mkey}, nil
}

func (t Team) NewMember() TeamObject {
	members := TeamBucket{t.Id, "member"}
	return members.NewObject("")
}

func (t Team) NewAdmin(member_id string) TeamObject {
	admins := TeamBucket{t.Id, "member_admin"}
	admin := admins.NewObject("")
	admin.Id = member_id
	return admin
}

func (t Team) IsAdmin(member_id string) bool {
	member_admin := TeamBucket{t.Id, "member_admin"}
	exists, err := member_admin.Exists(member_id)
	if err == nil && exists {
		return true
	}
	return false
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
	team_db, err := TeamDBPool.Find(t.Id)
	if err != nil {
		return item, err
	}
	ts := time.Now().UnixNano()
	k := fmt.Sprintf("%d-%s-%s", ts, "team", t.Id)
	item = k + "-" + iv
	err = team_db.Put("log-" + k, iv)
	return item, err
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
	team_db, err := TeamDBPool.Find(id)
	if err != nil {
		return item, err
	}
	ct, err := team_db.Get("settings-team")
	if ct != "" {
		item = Team{id, ct}
	}
	return item, err
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
