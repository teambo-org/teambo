package controller

import (
	"../model"
	"encoding/json"
	"net/http"
	// "fmt"
)

func Acct(w http.ResponseWriter, r *http.Request) {
	id := r.FormValue("id")
	akey := r.FormValue("akey")
	ct := r.FormValue("ct")

	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if id == "" || akey == "" {
		error_out(w, "Email and password required", 400)
		return
	}

	acct, _ := model.FindAcct(id, akey)
	if acct.Id == "" {
		error_out(w, "Account not found", 404)
		return
	}

	acct, err := model.CreateAcct(id, akey, ct)
	if err != nil {
		error_out(w, "Account could not be saved", 500)
		return
	}

	res, _ := json.Marshal(acct)
	w.Write([]byte(string(res)))
}

func AcctAuth(w http.ResponseWriter, r *http.Request) {
	id := r.FormValue("id")
	akey := r.FormValue("akey")

	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if id == "" || akey == "" {
		error_out(w, "Email and password required", 400)
		return
	}

	acct, err := model.FindAcct(id, akey)
	if err != nil {
		error_out(w, "Account could not be retrieved", 500)
		return
	}
	if acct.Id == "" || acct.Ciphertext == "new" {
		exists, _ := model.AcctExists(id)
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
