package controller

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/teambo-org/teambo/model"
	"github.com/teambo-org/teambo/socket"
)

func TeamSocket(w http.ResponseWriter, r *http.Request) {
	team_id := r.FormValue("team_id")
	member_id := r.FormValue("member_id")
	salt := r.FormValue("salt")
	sig := r.FormValue("sig")
	ts := r.FormValue("ts")

	if r.Method != "GET" {
		http.Error(w, "Method not allowed", 405)
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

	if team_id == "" || member_id == "" || salt == "" || sig == "" {
		msg, _ := json.Marshal(map[string]interface{}{
			"channel_id": team_id,
			"code":       400,
			"type":       "error",
			"msg":        "Team Id, Member Id, Salt and Signature required",
		})
		ws.WriteMessage(websocket.TextMessage, msg)
		return
	}

	team, err := model.FindTeam(team_id)
	if err != nil || team.Id != team_id {
		msg, _ := json.Marshal(map[string]interface{}{
			"channel_id": team_id,
			"code":       404,
			"type":       "error",
			"msg":        "Team could not be found",
		})
		ws.WriteMessage(websocket.TextMessage, msg)
		return
	}

	member_keys := model.TeamBucket{team.Id, "member_key"}
	member_key, _ := member_keys.Find(member_id)

	if member_key.Ciphertext == "" {
		msg, _ := json.Marshal(map[string]interface{}{
			"channel_id": team.Id,
			"code":       403,
			"type":       "error",
			"msg":        "You do not have access to this team",
		})
		ws.WriteMessage(websocket.TextMessage, msg)
		return
	}

	h := sha256.New()
	h.Write([]byte(salt))
	h.Write([]byte(member_key.Ciphertext))
	computed_sig := base64.StdEncoding.EncodeToString(h.Sum(nil))

	if computed_sig != sig {
		msg, _ := json.Marshal(map[string]interface{}{
			"channel_id": team.Id,
			"code":       403,
			"type":       "error",
			"msg":        "Invalid request signature",
		})
		ws.WriteMessage(websocket.TextMessage, msg)
		return
	}

	c := socket.CreateConnection([]string{team.Id}, ws)
	if ts != "0" && ts != "" {
		logs, err := model.TeamLogSince(team.Id, ts)
		if err == nil {
			log_objs := model.TeamLogParse(logs)
			for _, log := range log_objs {
				c.Write(websocket.TextMessage, socket.JsonMessage(team.Id, log))
			}
		}
	}

	integrity, err := model.TeamIntegrityCache.Find(team.Id)
	if err == nil {
		hash := integrity.Hash()
		c.Write(websocket.TextMessage, socket.JsonMessage(team.Id, map[string]interface{}{
			"type": "integrity",
			"hash": hash,
			"ts":   fmt.Sprintf("%d", time.Now().UTC().UnixNano()),
		}))
	}

	c.Write(websocket.TextMessage, socket.JsonMessage(team.Id, map[string]interface{}{
		"type": "timesync",
		"ts":   fmt.Sprintf("%d", time.Now().UTC().UnixNano()),
	}))

	socket.TeamHub.Register <- c
	go c.Writer()
	c.Reader(socket.TeamHub)
	// Reader could be used to:
	// - add or remove channels
	// - send chat messages
	// - update following integrity mismatch
}

func TeamIntegrity(w http.ResponseWriter, r *http.Request) {
	ivs := r.FormValue("ivs")

	team, _, err := auth_team(w, r)
	if err != nil {
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", 405)
		return
	}

	iv_list := strings.Split(ivs, ",")

	integrity, err := model.TeamIntegrityCache.Find(team.Id)
	if err != nil {
		http.Error(w, "Integrity cache not found", 404)
		return
	}

	log := integrity.DiffLog(iv_list)

	res_json, _ := json.Marshal(map[string]interface{}{
		"log": log,
	})
	w.Write([]byte(string(res_json)))
}
