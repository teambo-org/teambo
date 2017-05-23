package controller

import (
	"../model"
	"../util"
	"encoding/json"
	"errors"
	"net/http"
	"crypto/sha256"
	"encoding/base64"
	// "fmt"
	// "log"
)

func AcctVerification(w http.ResponseWriter, r *http.Request) {
	email     := r.FormValue("email")
	akey      := r.FormValue("akey")
	id        := r.FormValue("id")
	vkey      := r.FormValue("vkey")
	ct        := r.FormValue("ct")
	bypass    := r.FormValue("bypass")
	beta_code := r.FormValue("beta")
	ikey      := r.FormValue("ikey")
	ihash     := r.FormValue("ihash")
	pkey      := r.FormValue("pkey")

	if id == "" && email != "" {
		h := sha256.New()
		h.Write([]byte(email))
		id = base64.StdEncoding.EncodeToString(h.Sum(nil))
	}

	verification_required := true
	if bypass != "" {
		verification_required = !(bypass == "true" && util.Config("app.testing") == "true")
	}

	beta := model.BetaCode{}
	err := errors.New("")

	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if vkey != "" {
		v, err := model.FindAcctVerification(id, akey)
		if err != nil {
			error_out(w, "Verification could not be completed", 500)
			return
		}
		if v.Vkey != vkey {
			error_out(w, "Verification has expired", 404)
			return
		}
		if pkey == "" {
			error_out(w, "Password protection token required", 400)
			return
		}
		if ct == "" {
			error_out(w, "Account Ciphertext required", 400)
			return
		}
		_, err = model.CreateAcct(id, akey, pkey, ct)
		if err != nil {
			error_out(w, "Account could not be created", 500)
			return
		}
		v.Delete()
		msg, _ := json.Marshal(map[string]bool{
			"success": true,
		})
		http.Error(w, string(msg), 200)
	} else {
		if email == "" || akey == "" {
			error_out(w, "Email and access key required", 400)
			return
		}
		if ikey != "" && ihash != "" {
			invite, _ := model.InviteFind(ikey)
			if invite.Hash == "" {
				error_out(w, "Invite Has Expired", 404)
				return
			}
			if invite.Hash != ihash {
				error_out(w, "Invalid Invite Code", 403)
				return
			}
			if invite.Redeem() {
				verification_required = false
			} else {
				error_out(w, "Invite Code already redeemed", 403)
				return
			}
		}
		if verification_required {
			if beta_code == "" {
				error_out(w, "Beta code required", 400)
				return
			}
			beta, _ := model.FindBetaCode(beta_code)
			if beta.Found == "" {
				error_out(w, "Invalid Beta Code", 403)
				return
			}
		}

		// TODO: Add rate limiting for auth
		// Check account failed loggin log entry count by id
		// Reject if more than ... 5?
		// Remember... verification is a fallback to unlock locked accounts

		acct, _ := model.FindAcct(id, akey)
		if acct.Ciphertext != "" && acct.Ciphertext != "new" {
			error_out(w, "Account already exists", 409)
			return
		} else {
			// Treat as failed login attempt
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
		if !verification_required {
			msg, _ = json.Marshal(map[string]interface{}{
				"success": true,
				"vkey":    vkey,
			})
		} else {
			// TODO: move email to template
			// TODO: move emails to background job
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
		if(beta.Code != "" && beta.Found != "") {
			beta.Delete()
		}
		http.Error(w, string(msg), 201)
	}
}
