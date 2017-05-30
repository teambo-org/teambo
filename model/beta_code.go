package model

import (
	// "log"
)

type BetaCode struct {
	Code  string `json:"code"`
	Found string `json:"found"`
}

func (bc *BetaCode) Delete() error {
	return db_invite.Delete([]byte("beta_code-" + bc.Code))
}

func FindBetaCode(code string) (item BetaCode, err error) {
	v, err := db_invite.Get([]byte("beta_code-" + code))
	if err == nil {
		item = BetaCode{code, string(v)}
	}
	return item, err
}

func BetaCodePurgeExpired() ([]string, error) {
	return PurgeExpired(db_invite, "beta_code")
}
