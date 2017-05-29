package model

type InviteAcceptance struct {
	Id         string `json:"id"`
	Ciphertext string `json:"ct"`
}

func (o *InviteAcceptance) Delete() (err error) {
	k := []byte("invite_acceptance-" + o.Id)
	return db_invite.Delete(k, nil)
}

func InviteAcceptanceCreate(id, ct string) (item InviteAcceptance, err error) {
	k := []byte("invite_acceptance-" + id)
	err = db_invite.Put(k, []byte(ct), nil)
	if err == nil {
		item = InviteAcceptance{id, ct}
	}
	return item, err
}

func InviteAcceptanceFind(id string) (item InviteAcceptance, err error) {
	k := []byte("invite_acceptance-" + id)
	ct, err := db_invite.Get(k, nil)
	if err == nil {
		item = InviteAcceptance{id, string(ct)}
	}
	return item, err
}
