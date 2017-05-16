package controller

import (
	"../model"
	"../util"
	"encoding/json"
	"errors"
	"net/http"
	// "fmt"
)

func AcctVerification(w http.ResponseWriter, r *http.Request) {
	email := r.FormValue("email")
	akey := r.FormValue("akey")
	vkey := r.FormValue("vkey")
	bypass := r.FormValue("bypass")
	beta_code := r.FormValue("beta")

	err := errors.New("")

	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if vkey != "" {
		v, err := model.FindAcctVerification(akey)
		if err != nil {
			error_out(w, "Verification could not be completed", 500)
			return
		}
		if v.Vkey != vkey {
			error_out(w, "Verification has expired", 404)
			return
		}
		_, err = model.CreateAcct(akey, "new")
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
		if (email == "") || akey == "" {
			error_out(w, "Email and access key required", 400)
			return
		}

		acct, _ := model.FindAcct(akey)
		if acct.Ciphertext != "" && acct.Ciphertext != "new" {
			error_out(w, "Account already exists", 409)
			return
		}

		if beta_code == "" {
			error_out(w, "Beta code required", 400)
			return
		}

		beta, _ := model.FindBetaCode(beta_code)
		if beta.Found == "" {
			error_out(w, "Invalid Beta Code", 403)
			return
		}

		// TODO : Add rate limiting for acct verification emails

		vkey = util.RandStr(16)
		_, err = model.CreateAcctVerification(akey, vkey)
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
		beta.Delete()
		http.Error(w, string(msg), 201)
	}
}
