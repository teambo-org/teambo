package main

import (
	"encoding/json"
	"net/http"
	// "fmt"
)

func handle_acct(w http.ResponseWriter, r *http.Request) {
	id   := r.FormValue("id")
	akey := r.FormValue("akey")
	ct   := r.FormValue("ct")

	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if id == "" || akey == "" {
		error_out(w, "Email and password required", 400)
		return
	}

	acct, _ := acct_find(id, akey)
	if acct.Id == "" {
		error_out(w, "Account not found", 404)
		return
	}

	acct, err := acct_create(id, akey, ct)
	if err != nil {
		error_out(w, "Account could not be saved", 500)
		return
	}

	res, _ := json.Marshal(acct)
	w.Write([]byte(string(res)))
}

func handle_acct_auth(w http.ResponseWriter, r *http.Request) {
	id   := r.FormValue("id")
	akey := r.FormValue("akey")

	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if id == "" || akey == "" {
		error_out(w, "Email and password required", 400)
		return
	}

	acct, err := acct_find(id, akey)
	if err != nil {
		error_out(w, "Account could not be retrieved", 500)
		return
	}
	if acct.Id == "" || acct.Ciphertext == "new" {
		exists, _ := acct_exists(id)
		if exists {
			// Check authentication failure limit
			// Log failed authentication
			error_out(w, "Incorrect Password", 403)
		} else {
			error_out(w, "Account not found", 404)
		}
		return
	}

	res, _ := json.Marshal(acct)
	w.Write([]byte(string(res)))
}
