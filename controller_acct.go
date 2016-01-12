package main

import (
	"encoding/json"
	"net/http"
	// "fmt"
)

func handle_acct(w http.ResponseWriter, r *http.Request) {
	hash := r.FormValue("hash")
	akey := r.FormValue("akey")
	ct := r.FormValue("ct")

	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if hash == "" || akey == "" {
		msg, _ := json.Marshal(map[string]string{
			"error": "Email and password required",
		})
		http.Error(w, string(msg), 400)
		return
	}

	acct, _ := acct_find(hash, akey)
	if acct.Hash == "" {
		msg, _ := json.Marshal(map[string]string{
			"error": "Account not found",
		})
		http.Error(w, string(msg), 404)
		return
	}

	acct, err := acct_create(hash, akey, ct)
	if err != nil {
		msg, _ := json.Marshal(map[string]string{
			"error": "Account could not be saved",
		})
		http.Error(w, string(msg), 500)
		return
	}

	res, _ := json.Marshal(acct)
	w.Write([]byte(string(res)))
}

func handle_acct_auth(w http.ResponseWriter, r *http.Request) {
	hash := r.FormValue("hash")
	akey := r.FormValue("akey")

	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if hash == "" || akey == "" {
		msg, _ := json.Marshal(map[string]string{
			"error": "Email and password required",
		})
		http.Error(w, string(msg), 400)
		return
	}

	acct, err := acct_find(hash, akey)
	if err != nil {
		msg, _ := json.Marshal(map[string]string{
			"error": "Account could not be retrieved",
		})
		http.Error(w, string(msg), 500)
		return
	}
	if acct.Hash == "" || acct.Ciphertext == "new" {
		exists, _ := acct_exists(hash)
		if exists {
			msg, _ := json.Marshal(map[string]string{
				"error": "Incorrect Password",
			})
			http.Error(w, string(msg), 403)
		} else {
			msg, _ := json.Marshal(map[string]string{
				"error": "Account not found",
			})
			http.Error(w, string(msg), 404)
		}
		return
	}

	res, _ := json.Marshal(acct)
	w.Write([]byte(string(res)))
}
