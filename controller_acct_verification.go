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
	id    := r.FormValue("id")
	akey  := r.FormValue("akey")
	vkey  := r.FormValue("vkey")
	bypass := r.FormValue("bypass")

	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if (email == "" && id == "") || akey == "" {
		error_out(w, "Email and password required", 400)
		return
	}

	if vkey != "" {
		v, err := acct_verification_find(id, akey, vkey)
		if err != nil {
			error_out(w, "Verification could not be completed", 500)
			return
		}
		if v.Id == "" {
			error_out(w, "Verification has expired", 404)
			return
		}
		_, err = acct_create(id, akey, "new")
		if err != nil {
			error_out(w, "Account could not be created", 500)
			return
		}
		err = acct_verification_delete(id, akey)
		msg, _ := json.Marshal(map[string]bool{
			"success": true,
		})
		http.Error(w, string(msg), 200)
	} else {
		hash := sha256.New()
		hash.Write([]byte(email))
		id = base64.StdEncoding.EncodeToString(hash.Sum(nil))
		
		// Don't issue verification for existing accounts
		acct, err := acct_find(id, akey)
		if acct.Id != "" {
			error_out(w, "Account already exists", 409)
			return
		}
		
		if bypass != "true" || config["tests.enabled"] != "true" {
			// Protect against brute force
			count, err := acct_verification_count(id)
			if count > 3 || err != nil {
				error_out(w, "Account verification limit reached", 403)
				return
			}
		}
		vkey = randStr(16)
		_, err = acct_verification_create(id, akey, vkey)
		if err != nil {
			error_out(w, "Verification could not be sent", 500)
			return
		}
		scheme := "http"
		if config["ssl.active"] == "true" {
			scheme = scheme + "s"
		}
		msg := []byte("")
		if bypass == "true" && config["tests.enabled"] == "true" {
			msg, _ = json.Marshal(map[string]interface{}{
				"success": true,
				"vkey": vkey,
			})
		} else {
			subject := "Teambo Account Verification"
			url := scheme + "://" + config["app.host"] + "/#/login?vkey=" + vkey
			body := "Click the link below to verify your new Teambo account:<br/><br/><a href='" + url + "'>"+url+"</a>"
			err = sendMail(email, subject, body)
			if err != nil {
				error_out(w, err.Error(), 500)
				return
			}
			msg, _ = json.Marshal(map[string]bool{
				"success": true,
			})
		}
		http.Error(w, string(msg), 201)
	}
}
