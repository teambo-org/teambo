package controller

import (
	"../model"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"net/http"
)

func NewsletterUnsubscribe(w http.ResponseWriter, r *http.Request) {
	email := r.FormValue("email")
	chk := r.FormValue("chk")

	if email == "" {
		error_out(w, "Email Address required", 400)
		return
	}
	if chk == "" {
		error_out(w, "Checksum required", 400)
		return
	}

	ts, err := model.NewsletterFind(email)
	if err != nil {
		error_out(w, "Unknown Error", 500)
		return
	}
	if len(ts) < 1 {
		error_out(w, "Subscription not found", 404)
		return
	}

	h := sha256.New()
	h.Write([]byte(email))
	h.Write([]byte(ts))
	hash := base64.StdEncoding.EncodeToString(h.Sum(nil))

	if hash != chk {
		error_out(w, "Checksum invalid", 403)
		return
	}

	err = model.NewsletterRemove(email)
	if err != nil {
		error_out(w, "Unknown Error", 500)
		return
	}

	msg, _ := json.Marshal(map[string]bool{
		"success": true,
	})
	http.Error(w, string(msg), 200)
}
