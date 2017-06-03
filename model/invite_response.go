package model

type InviteResponse struct {
	Id     string `json:"id"`
	PubKey string `json:"pubKey"`
}

func (o *InviteResponse) Delete() (err error) {
	k := "invite_response-" + o.Id
	return db_invite.Delete(k)
}

func InviteResponseCreate(id, pubKey string) (item InviteResponse, err error) {
	k := "invite_response-" + id
	err = db_invite.Put(k, pubKey)
	if err == nil {
		item = InviteResponse{id, pubKey}
	}
	return item, err
}

func InviteResponseFind(id string) (item InviteResponse, err error) {
	k := "invite_response-" + id
	pubKey, err := db_invite.Get(k)
	if err == nil {
		item = InviteResponse{id, pubKey}
	}
	return item, err
}
