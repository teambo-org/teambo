package controller

import (
	"bytes"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"html/template"
	"net/http"

	"github.com/teambo-org/teambo/model"
	"github.com/teambo-org/teambo/service"
	"github.com/teambo-org/teambo/util"
)

func AcctUnlock(w http.ResponseWriter, r *http.Request) {
	email := r.FormValue("email")
	rkey := r.FormValue("rkey")
	id := r.FormValue("id")

	if id == "" {
		if email == "" {
			error_out(w, "Email required", 400)
			return
		}
		h := sha256.New()
		h.Write([]byte(email))
		id = base64.StdEncoding.EncodeToString(h.Sum(nil))
	}

	verification_required := true
	if util.Config.Get("acct.verification_required") == "false" {
		verification_required = false
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if rkey != "" {
		if !model.AcctThrottle.RedeemReset(id, rkey) {
			error_out(w, "Reset code has expired", 404)
			return
		}
		msg, _ := json.Marshal(map[string]bool{
			"success": true,
		})
		http.Error(w, string(msg), 200)
	} else {
		if model.AcctThrottle.HasReset(id) {
			error_out(w, "Reset code already sent", 409)
			return
		}
		if model.AcctThrottle.RemainingResets(id) < 1 {
			error_out(w, "Reset limit has been reached", 403)
			return
		}

		rkey := model.AcctThrottle.CreateReset(id)

		msg := []byte("")
		if !verification_required {
			msg, _ = json.Marshal(map[string]interface{}{
				"success": true,
				"rkey":    rkey,
			})
		} else {
			subject := "Teambo Account Unlock"

			scheme := "http"
			if util.Config.Get("ssl.active") == "true" {
				scheme = scheme + "s"
			}
			t, err := template.ParseFiles("template/email/unlock.html")
			data := map[string]interface{}{
				"email": email,
				"link":  scheme + "://" + util.Config.Get("app.host") + "/#/account/unlock?id=" + id + "&rkey=" + rkey,
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
		http.Error(w, string(msg), 201)
	}
}
