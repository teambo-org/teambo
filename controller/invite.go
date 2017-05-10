package controller

import (
	"../model"
	"../util"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	// "errors"
	"net/http"
	"net/url"
	"time"
	// "fmt"
)

func Invite(w http.ResponseWriter, r *http.Request) {
	email := r.FormValue("email")
	team_name := r.FormValue("team_name")
	sender_name := r.FormValue("sender_name")
	sender_email := r.FormValue("sender_email")

	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	ikey := util.RandStr(16)
	chk := util.RandStr(16)

	hasher := sha256.New()
	hasher.Write([]byte(ikey+chk+email))
	hash := base64.StdEncoding.EncodeToString(hasher.Sum(nil))

	ttl := int64(72 * time.Hour)

	invite, err := model.InviteCreate(ikey, hash, ttl)
	if err != nil {
		error_out(w, "Invite could not be sent", 500)
		return
	}
	scheme := "http"
	if util.Config("ssl.active") == "true" {
		scheme = scheme + "s"
	}

	subject := "Teambo Invite"
	link := scheme + "://" + util.Config("app.host") + "/#/invite?ikey="+ikey+"&chk="+chk
	body := "You have been invited to join a team on Teambo<br/><br/>"
	if team_name != "" {
		body = body + "Team: <b>" + team_name + "</b><br/>"
		link = link + "&name=" + url.QueryEscape(team_name)
	}
	if sender_name != "" && sender_email != "" {
		body = body + "Admin: " + sender_name + " &lt; " + sender_email + " &gt; " + "<br/>"
	}
	body = body + "<br/>"
	body = body + "Click the link below within the next 72 hours to respond:<br/>"
	body = body + "<a href='" + link + "'>" + link + "</a>"
	err = util.SendMail(email, subject, body)
	if err != nil {
		invite.Delete()
		error_out(w, "Invite could not be sent", 500)
		return
	}
	msg, _ := json.Marshal(map[string]string{
		"ikey": ikey,
	})

	http.Error(w, string(msg), 201)
}

func InviteResponse(w http.ResponseWriter, r *http.Request) {
	ikey := r.FormValue("ikey")
	hash := r.FormValue("hash")
	pubKey := r.FormValue("pubKey")

	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	now := time.Now().UnixNano()
	invite, err := model.InviteFind(ikey)
	if err != nil {
		error_out(w, "Invite could not be found", 500)
		return
	}
	if invite.Id == "" {
		error_out(w, "Invite has expired", 404)
		return
	}
	if invite.Hash != hash {
		error_out(w, "Incorrect authentication hash", 403)
		return
	}
	invite.Delete()

	if invite.Expiration < now {
		error_out(w, "Invite has expired", 404)
		return
	}

	_, err = model.InviteResponseCreate(ikey, pubKey)
	if err != nil {
		error_out(w, "Invite could not be accepted", 500)
		return
	}

	msg, _ := json.Marshal(map[string]bool{
		"success": true,
	})
	http.Error(w, string(msg), 201)

}
