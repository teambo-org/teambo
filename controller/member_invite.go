package controller

import (
	"../model"
	"../util"
	// "crypto/sha256"
	// "encoding/base64"
	"encoding/json"
	// "errors"
	"net/http"
	// "fmt"
)

func MemberInvite(w http.ResponseWriter, r *http.Request) {
	mkey := r.FormValue("mkey")
	email := r.FormValue("email")
	ikey := r.FormValue("ikey")
	team_name := r.FormValue("team_name")
	sender_name := r.FormValue("sender_name")
	sender_email := r.FormValue("sender_email")

	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	team, err := auth_team(w, r)
	if err != nil {
		return
	}
	
	if !team.IsAdmin(mkey) {
		error_out(w, "Only team admins can invite new team members", 403)
		return
	}
	
	ikey = util.RandStr(16)
	invite := team.InviteCreate(ikey)
	err = invite.Save()
	if err != nil {
		error_out(w, "Invite could not be sent", 500)
		return
	}
	scheme := "http"
	if util.Config("ssl.active") == "true" {
		scheme = scheme + "s"
	}
	
	subject := "Teambo Invite"
	url := scheme + "://" + util.Config("app.host") + "/#/invite?team_id="+team.Id+"&ikey=" + ikey
	body := "You have been invited to join a team on Teambo<br/><br/>"
	if team_name != "" {
		body = body + "Team: <b>" + team_name + "</b><br/>"
	}
	if sender_name != "" && sender_email != "" {
		body = body + "Admin: " + sender_name + " &lt; " + sender_email + " &gt; " + "<br/>"
	}
	body = body + "<br/>"
	body = body + "Click the link below to respond:<br/>"
	body = body + "<a href='" + url + "'>" + url + "</a>"
	err = util.SendMail(email, subject, body)
	if err != nil {
		invite.Remove()
		error_out(w, "Invite could not be sent", 500)
		return
	}
	msg, _ := json.Marshal(map[string]string{
		"ikey": ikey,
	})
	
	http.Error(w, string(msg), 201)
}

func MemberInviteResponse(w http.ResponseWriter, r *http.Request) {
	team_id := r.FormValue("team_id")
	ikey := r.FormValue("ikey")
	email := r.FormValue("email")
	pubKey := r.FormValue("pubKey")
	
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	
	team, err := model.FindTeam(team_id)
	if err != nil {
		error_out(w, "Invite has expired", 404)
		return
	}
	
	invite, err := team.InviteFind(ikey)
	if err != nil {
		error_out(w, "Invite could not be found", 500)
		return
	}
	if invite.Id == "" {
		error_out(w, "Invite has expired", 404)
		return
	}
	invite.Remove()
	
	inviteResponse := team.InviteResponseCreate(ikey, pubKey)
	err = inviteResponse.Save()
	if err != nil {
		error_out(w, "Invite could not be accepted", 500)
		return
	}
	
	subject := "Teambo Invite Response"
	body := "Your team invite response has been received.<br/>"
	body = body + "You can expect to receive another email to finalize the invite process as soon as an admin from the team to which you have been invited accepts your response.<br/>"
	body = body + "This extra step is necessary in order to ensure that your team remains highly secure."
	err = util.SendMail(email, subject, body)
	if err != nil {
		invite.Remove()
		error_out(w, "Invite could not be sent", 500)
		return
	}
	
	msg, _ := json.Marshal(map[string]bool{
		"success": true,
	})
	http.Error(w, string(msg), 200)
	
}
