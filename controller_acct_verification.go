package main

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"net/http"
	// "fmt"
)

func handle_acct_verification(w http.ResponseWriter, r *http.Request) {
	email := r.FormValue("email")
	hash := r.FormValue("hash")
	akey := r.FormValue("akey")
	vkey := r.FormValue("vkey")

	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if (hash == "" && email == "") || akey == "" {
		msg, _ := json.Marshal(map[string]string{
			"error": "Email and password required",
		})
		http.Error(w, string(msg), 400)
		return
	}

	if vkey != "" {
		_, err := acct_verification_find(hash, akey, vkey)
		if err != nil {
			msg, _ := json.Marshal(map[string]string{
				"error": err.Error(),
			})
			http.Error(w, string(msg), 409)
			return
		}
		_, err = acct_create(hash, akey, "new")
		if err != nil {
			msg, _ := json.Marshal(map[string]string{
				"error": "Account could not be created",
			})
			http.Error(w, string(msg), 500)
			return
		}
		err = acct_verification_delete(hash, akey)
		msg, _ := json.Marshal(map[string]bool{
			"success": true,
		})
		http.Error(w, string(msg), 200)
	} else {
		hash := sha256.New()
		hash.Write([]byte(email))
		email_hash := base64.StdEncoding.EncodeToString(hash.Sum(nil))
		vkey := randStr(16)
		_, err := acct_verification_create(email_hash, akey, vkey)
		if err != nil {
			msg, _ := json.Marshal(map[string]string{
				"error": "Verification could not be sent",
			})
			http.Error(w, string(msg), 500)
			return
		}
		scheme := "http"
		if config["ssl.active"] == "true" {
			scheme = scheme + "s"
		}
		subject := "Teambo Account Verification"
		body := "Click the link below to verify your account:\r\n\r\n" + scheme + "://" + config["app.host"] + "/#/login?vkey=" + vkey
		err = sendMail(email, subject, body)
		if err != nil {
			msg, _ := json.Marshal(map[string]string{
				"error": err.Error(),
			})
			http.Error(w, string(msg), 500)
			return
		}
		msg, _ := json.Marshal(map[string]bool{
			"success": true,
		})
		http.Error(w, string(msg), 201)
	}
}
