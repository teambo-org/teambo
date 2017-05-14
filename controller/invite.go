package controller

import (
	"../model"
	"../util"
	"../socket"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"github.com/gorilla/websocket"
	// "errors"
	"log"
	"net/http"
	"net/url"
	"time"
	"strings"
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

	scheme := "http"
	if util.Config("ssl.active") == "true" {
		scheme = scheme + "s"
	}

	if r.Method == "POST" {
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
			error_out(w, "Invite Response could not be created", 500)
			return
		}

		socket.InviteResponseHub.Broadcast <- socket.JsonMessage(ikey, map[string]interface{}{
			"pubKey": pubKey,
		})

		msg, _ := json.Marshal(map[string]bool{
			"success": true,
		})
		http.Error(w, string(msg), 201)
	} else if r.Method == "GET" {
		if r.Header.Get("Origin") != scheme + "://" + util.Config("app.host") {
			http.Error(w, "Origin not allowed", 403)
			return
		}
		ws, err := websocket.Upgrade(w, r, nil, 1024, 1024)
		if _, ok := err.(websocket.HandshakeError); ok {
			http.Error(w, "Not a websocket handshake", 400)
			return
		} else if err != nil {
			log.Println(err)
			return
		}
		ikeys := strings.Split(ikey, ",")
		c := socket.CreateConnection(ikeys, ws)
		for _, k := range ikeys {
			inviteResponse, _ := model.InviteResponseFind(k)
			if inviteResponse.PubKey != "" {
				c.Write(websocket.TextMessage, socket.JsonMessage(k, map[string]interface{}{
					"pubKey": inviteResponse.PubKey,
				}))
			} else {
				invite, _ := model.InviteFind(k)
				if invite.Hash == "" {
					c.Write(websocket.TextMessage, socket.JsonMessage(k, map[string]interface{}{
						"expired": true,
					}))
				}
			}
		}
		socket.InviteResponseHub.Register <- c
		c.Writer()
	} else {
		http.Error(w, "Method not allowed", 405)
		return
	}
}

func InviteAcceptance(w http.ResponseWriter, r *http.Request) {
	ikey := r.FormValue("ikey")
	ct := r.FormValue("ct")
	member_id := r.FormValue("member_id")
	mkey := r.FormValue("mkey")

	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	scheme := "http"
	if util.Config("ssl.active") == "true" {
		scheme = scheme + "s"
	}

	if r.Method == "POST" {

		team, err := auth_team(w, r)
		if err != nil {
			return
		}
		if !team.IsAdmin(mkey) {
			error_out(w, "Only a team admin can accept invites", 403)
			return
		}

		inviteResponse, err := model.InviteResponseFind(ikey)
		if err != nil {
			error_out(w, "Invite Response could not be found", 500)
			return
		}
		if inviteResponse.Id == "" {
			error_out(w, "Invite has already been accepted", 404)
			return
		}

		memberKey := team.NewMemberKey()
		memberKey.Ciphertext = member_id
		err = memberKey.Save()
		if err != nil {
			team.Remove()
			error_out(w, "Team member could not be saved", 500)
			return
		}

		_, err = model.InviteAcceptanceCreate(ikey, ct + "-" + memberKey.Id)
		if err != nil {
			error_out(w, "Invite could not be accepted", 500)
			return
		}

		inviteResponse.Delete()

		socket.InviteAcceptanceHub.Broadcast <- socket.JsonMessage(ikey, map[string]interface{}{
			"ct": ct,
			"mkey": memberKey.Id,
		})

		msg, _ := json.Marshal(map[string]bool{
			"success": true,
		})
		http.Error(w, string(msg), 201)
	} else if r.Method == "GET" {
		if r.Header.Get("Origin") != scheme + "://" + util.Config("app.host") {
			http.Error(w, "Origin not allowed", 403)
			return
		}
		ws, err := websocket.Upgrade(w, r, nil, 1024, 1024)
		if _, ok := err.(websocket.HandshakeError); ok {
			http.Error(w, "Not a websocket handshake", 400)
			return
		} else if err != nil {
			log.Println(err)
			return
		}
		ikeys := strings.Split(ikey, ",")
		c := socket.CreateConnection(ikeys, ws)
		for _, k := range ikeys {
			inviteAcceptance, _ := model.InviteAcceptanceFind(k)
			if inviteAcceptance.Ciphertext != "" {
				parts := strings.Split(inviteAcceptance.Ciphertext, "-")
				c.Write(websocket.TextMessage, socket.JsonMessage(k, map[string]interface{}{
					"ct":   parts[0],
					"mkey": parts[1],
				}))
			} else {
				inviteResponse, _ := model.InviteResponseFind(k)
				if inviteResponse.PubKey == "" {
					c.Write(websocket.TextMessage, socket.JsonMessage(k, map[string]interface{}{
						"ct": "expired",
					}))
				}
			}
		}
		socket.InviteAcceptanceHub.Register <- c
		c.Writer()
	} else {
		http.Error(w, "Method not allowed", 405)
		return
	}
}
