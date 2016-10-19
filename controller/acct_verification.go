package controller

import (
	"../model"
	"../util"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	// "fmt"
)

func AcctVerification(w http.ResponseWriter, r *http.Request) {
	email := r.FormValue("email")
	id := r.FormValue("id")
	akey := r.FormValue("akey")
	vkey := r.FormValue("vkey")
	bypass := r.FormValue("bypass")

	err := errors.New("")

	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if (email == "" && id == "") || akey == "" {
		error_out(w, "Email and password required", 400)
		return
	}

	if vkey != "" {
		v, err := model.FindAcctVerification(id, akey, vkey)
		if err != nil {
			error_out(w, "Verification could not be completed", 500)
			return
		}
		if v.Id == "" {
			error_out(w, "Verification has expired", 404)
			return
		}
		_, err = model.CreateAcct(id, akey, "new")
		if err != nil {
			error_out(w, "Account could not be created", 500)
			return
		}
		err = v.Delete()
		if err != nil {
			error_out(w, "Verification could not be deleted", 500)
			return
		}
		msg, _ := json.Marshal(map[string]bool{
			"success": true,
		})
		http.Error(w, string(msg), 200)
	} else {
		hash := sha256.New()
		hash.Write([]byte(email))
		id = base64.StdEncoding.EncodeToString(hash.Sum(nil))

		// Don't issue verification for existing accounts
		acct, _ := model.FindAcct(id, akey)
		if acct.Id != "" {
			error_out(w, "Account already exists", 409)
			return
		}

		if bypass != "true" || util.Config("tests.enabled") != "true" {
			// Protect against brute force
			count, err := model.CountAcctVerification(id)
			if count > 3 || err != nil {
				error_out(w, "Account verification limit reached", 403)
				return
			}
		}
		vkey = util.RandStr(16)
		_, err = model.CreateAcctVerification(id, akey, vkey)
		if err != nil {
			error_out(w, "Verification could not be sent", 500)
			return
		}
		scheme := "http"
		if util.Config("ssl.active") == "true" {
			scheme = scheme + "s"
		}
		msg := []byte("")
		if bypass == "true" && util.Config("tests.enabled") == "true" {
			msg, _ = json.Marshal(map[string]interface{}{
				"success": true,
				"vkey":    vkey,
			})
		} else {
			subject := "Teambo Account Verification"
			url := scheme + "://" + util.Config("app.host") + "/#/login?vkey=" + vkey
			body := "Click the link below to verify your new Teambo account:<br/><br/><a href='" + url + "'>" + url + "</a>"
			err = util.SendMail(email, subject, body)
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
