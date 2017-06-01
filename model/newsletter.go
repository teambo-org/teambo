package model

import (
	"fmt"
	"time"
	// "log"
)

func NewsletterInsert(email string) error {
	ts := fmt.Sprintf("%d", time.Now().UnixNano())
	k := []byte(email)
	v, err := db_newsletter.Get(k)
	if err == nil && len(v) == 0 {
		err = db_newsletter.Put(k, []byte(ts))
	}
	return err
}

func NewsletterRemove(email string) error {
	return db_newsletter.Delete([]byte(email))
}

func NewsletterFind(email string) ([]byte, error) {
	return db_newsletter.Get([]byte(email))
}
