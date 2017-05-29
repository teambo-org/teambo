package model

import (
	db_util "github.com/syndtr/goleveldb/leveldb/util"
	"fmt"
	"time"
)

type Invite struct {
	Id   string `json:"id"`
	Hash string `json:"hash"`
}

func (o *Invite) Delete() (err error) {
	db_invite.Delete([]byte("invite-"+o.Id), nil)
	db_invite.Delete([]byte("invite_response-"+o.Id), nil)
	db_invite.Delete([]byte("invite_acceptance-"+o.Id), nil)
	db_invite.Delete([]byte("invite_redeemed-"+o.Id), nil)
	return nil
}

func (o *Invite) Redeem() bool {
	k := []byte("invite_redeemed-" + o.Id)
	ts := []byte(fmt.Sprintf("%d", time.Now().UnixNano()))
	v, err := db_invite.Get(k, nil)
	if err == nil || string(v) != "0" {
		return false
	}
	err = db_invite.Put(k, ts, nil)
	return err == nil
}

func (o *Invite) Redeemable() bool {
	k := []byte("invite_redeemed-" + o.Id)
	v, err := db_invite.Get(k, nil)
	return err == nil && string(v) == "0"
}

func (o *Invite) MakeRedeemable() bool {
	k := []byte("invite_redeemed-" + o.Id)
	err := db_invite.Put(k, []byte("0"), nil)
	return err == nil
}

func InviteCreate(id, hash string, ttl int64) (item Invite, err error) {
	k := []byte("invite-" + id)
	err = db_invite.Put(k, []byte(hash), nil)
	if err != nil {
		return item, nil
	}
	ts := fmt.Sprintf("%d", time.Now().UnixNano() + ttl)
	ek := []byte("invite_expire-" + ts)
	err = db_invite.Put(ek, []byte(id), nil)
	if err != nil {
		return item, nil
	}
	return Invite{id, hash}, nil
}

func InviteFind(id string) (item Invite, err error) {
	k := []byte("invite-" + id)
	v, err := db_invite.Get(k, nil)
	if err == nil && len(v) > 0 {
		item.Id = id
		item.Hash = string(v)
	}
	return item, nil
}

type InviteExpires struct {
	Ts     string `json:"ts"`
	Invite Invite `json:"invite"`
}

func (o *InviteExpires) Delete() error {
	ek := []byte("invite_expire-" + o.Ts)
	return db_invite.Delete(ek, nil)
}

func InviteFindExpired() (items []InviteExpires, err error) {
	iter := db_invite.NewIterator(&db_util.Range{
		Start: []byte("invite_expire-"),
		Limit: []byte("invite_expire-" + fmt.Sprintf("%d", time.Now().UnixNano())),
	}, nil)
	for iter.Next() {
		ts := iter.Key()
		id := iter.Value()
		items = append(items, InviteExpires{
			string(ts),
			Invite{string(id), ""},
		})
	}
	iter.Release()
	err = iter.Error()
	return items, err
}
