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
	batch := db_invite.Batch()
	batch.Delete("invite-" + o.Id)
	batch.Delete("invite_response-" + o.Id)
	batch.Delete("invite_acceptance-" + o.Id)
	batch.Delete("invite_redeemed-" + o.Id)
	return batch.Write()
}

func (o *Invite) Redeem() bool {
	k := "invite_redeemed-" + o.Id
	ts := fmt.Sprintf("%d", time.Now().UnixNano())
	v, err := db_invite.Get(k)
	if err == nil || v != "0" {
		return false
	}
	err = db_invite.Put(k, ts)
	return err == nil
}

func (o *Invite) Redeemable() bool {
	k := "invite_redeemed-" + o.Id
	v, err := db_invite.Get(k)
	return err == nil && v == "0"
}

func (o *Invite) MakeRedeemable() bool {
	k := "invite_redeemed-" + o.Id
	err := db_invite.Put(k, "0")
	return err == nil
}

func InviteCreate(id, hash string, ttl int64) (item Invite, err error) {
	k := "invite-" + id
	err = db_invite.Put(k, hash)
	if err != nil {
		return item, nil
	}
	ts := fmt.Sprintf("%d", time.Now().UnixNano()+ttl)
	ek := "invite_expire-" + ts
	err = db_invite.Put(ek, id)
	if err != nil {
		return item, nil
	}
	return Invite{id, hash}, nil
}

func InviteFind(id string) (item Invite, err error) {
	k := "invite-" + id
	v, err := db_invite.Get(k)
	if err == nil && v != "" {
		item.Id = id
		item.Hash = v
	}
	return item, nil
}

func InvitePurgeExpired() (ids []string, err error) {
	return PurgeExpired(db_invite, "invite")
}
