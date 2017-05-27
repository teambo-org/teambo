package controller

import (
	"../model"
	"../service"
	"../util"
	"bytes"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"html/template"
	"net/http"
	// "fmt"
	// "log"
)

func AcctVerification(w http.ResponseWriter, r *http.Request) {
	email := r.FormValue("email")
	akey := r.FormValue("akey")
	id := r.FormValue("id")
	vkey := r.FormValue("vkey")
	ct := r.FormValue("ct")
	bypass := r.FormValue("bypass")
	beta_code := r.FormValue("beta")
	ikey := r.FormValue("ikey")
	ihash := r.FormValue("ihash")
	pkey := r.FormValue("pkey")

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
	invite := model.Invite{}
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
			invite, _ = model.InviteFind(ikey)
			if invite.Hash == "" {
				error_out(w, "Invite Has Expired", 404)
				return
			}
			if invite.Hash != ihash {
				error_out(w, "Invalid Invite Code", 403)
				return
			}
			if invite.Redeemable() {
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
			beta, _ = model.FindBetaCode(beta_code)
			if beta.Found == "" {
				error_out(w, "Invalid Beta Code", 403)
				return
			}
		}

		if !model.AcctThrottle.Check(id) {
			error_data(w, 403, map[string]interface{}{
				"error": "Account is locked",
				"code": "acct_locked",
				"ttl": model.AcctThrottle.TTL,
				"resets": model.AcctThrottle.RemainingResets(id),
			})
			return
		}

		acct, _ := model.FindAcct(id, akey)
		if acct.Ciphertext != "" && acct.Ciphertext != "new" {
			error_out(w, "Account already exists", 409)
			return
		} else {
			model.AcctThrottle.Log(id)
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
			subject := "Teambo Account Verification"

			t, err := template.ParseFiles("templates/email/verification.html")
			data := map[string]interface{}{
				"email": email,
				"link":  scheme + "://" + util.Config("app.host") + "/#/login?vkey=" + vkey,
			}
			buf := new(bytes.Buffer)
			if err = t.Execute(buf, data); err != nil {
				return
			}
			body := buf.String()

			service.EmailQueue.Push(email, subject, body)

			msg, _ = json.Marshal(map[string]bool{
				"success": true,
			})
		}
		if beta.Code != "" && beta.Found != "" {
			beta.Delete()
		}
		if invite.Id != "" && invite.Hash != "" {
			invite.Redeem()
		}
		http.Error(w, string(msg), 201)
	}
}
