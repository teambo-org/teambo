package model

import (
	"fmt"
	"time"
	// "log"
)

func NewsletterInsert(email string) error {
	ts := fmt.Sprintf("%d", time.Now().UnixNano())
	v, err := db_newsletter.Get(email)
	if err == nil && len(v) == 0 {
		err = db_newsletter.Put(email, ts)
	}
	return err
}

func NewsletterRemove(email string) error {
	return db_newsletter.Delete(email)
}

func NewsletterFind(email string) (string, error) {
	return db_newsletter.Get(email)
}
