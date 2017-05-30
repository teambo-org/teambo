package model

import (
	"fmt"
	"time"
	// "log"
)

type Invite struct {
	Id   string `json:"id"`
	Hash string `json:"hash"`
}

func (o *Invite) Delete() (err error) {
	db_invite.Delete([]byte("invite-"+o.Id))
	db_invite.Delete([]byte("invite_response-"+o.Id))
	db_invite.Delete([]byte("invite_acceptance-"+o.Id))
	db_invite.Delete([]byte("invite_redeemed-"+o.Id))
	return nil
}

func (o *Invite) Redeem() bool {
	k := []byte("invite_redeemed-" + o.Id)
	ts := []byte(fmt.Sprintf("%d", time.Now().UnixNano()))
	v, err := db_invite.Get(k)
	if err == nil || string(v) != "0" {
		return false
	}
	err = db_invite.Put(k, ts)
	return err == nil
}

func (o *Invite) Redeemable() bool {
	k := []byte("invite_redeemed-" + o.Id)
	v, err := db_invite.Get(k)
	return err == nil && string(v) == "0"
}

func (o *Invite) MakeRedeemable() bool {
	k := []byte("invite_redeemed-" + o.Id)
	err := db_invite.Put(k, []byte("0"))
	return err == nil
}

func InviteCreate(id, hash string, ttl int64) (item Invite, err error) {
	k := []byte("invite-" + id)
	err = db_invite.Put(k, []byte(hash))
	if err != nil {
		return item, nil
	}
	ts := fmt.Sprintf("%d", time.Now().UnixNano() + ttl)
	ek := []byte("invite_expire-" + ts)
	err = db_invite.Put(ek, []byte(id))
	if err != nil {
		return item, nil
	}
	return Invite{id, hash}, nil
}

func InviteFind(id string) (item Invite, err error) {
	k := []byte("invite-" + id)
	v, err := db_invite.Get(k)
	if err == nil && len(v) > 0 {
		item.Id = id
		item.Hash = string(v)
	}
	return item, nil
}

func InvitePurgeExpired() (ids []string, err error) {
	return PurgeExpired(db_invite, "invite")
}
