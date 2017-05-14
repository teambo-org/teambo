package controller

import (
	"../model"
	"../socket"
	// "../util"
	"github.com/gorilla/websocket"
	"net/http"
	"time"
	"strings"
	"encoding/json"
	"log"
	"fmt"
)

func TeamSocket(w http.ResponseWriter, r *http.Request) {
	team_id := r.FormValue("team_id")
	mkey := r.FormValue("mkey")
	ts := r.FormValue("ts")

	if r.Method != "GET" {
		http.Error(w, "Method not allowed", 405)
		return
	}
	if r.Header.Get("Origin") != "http://"+r.Host && r.Header.Get("Origin") != "https://"+r.Host {
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

	team, err := model.FindTeam(team_id)
	if err != nil {
		msg, _ := json.Marshal(map[string]interface{}{
			"channel_id": team_id,
			"code": 500,
			"type": "error",
			"msg": "Could not access team database",
		})
		ws.WriteMessage(websocket.TextMessage, msg)
		return
	}

	if team.Id != team_id {
		msg, _ := json.Marshal(map[string]interface{}{
			"channel_id": team_id,
			"code": 404,
			"type": "error",
			"msg": "Team could not be found",
		})
		ws.WriteMessage(websocket.TextMessage, msg)
		return
	}

	member_id := team.GetMemberId(mkey)

	if member_id == "" {
		msg, _ := json.Marshal(map[string]interface{}{
			"channel_id": team_id,
			"code": 403,
			"type": "error",
			"msg": "You do not have access to this team",
		})
		ws.WriteMessage(websocket.TextMessage, msg)
		return
	}

	c := socket.CreateConnection([]string{team_id}, ws)
	if ts != "0" && ts != "" {
		logs, err := model.TeamLogSince(team_id, ts)
		if err == nil {
			log_objs := model.TeamLogParse(logs)
			for _, log := range log_objs {
				c.Write(websocket.TextMessage, socket.JsonMessage(team_id, log))
			}
		}
	}

	integrity, err := model.TeamIntegrityCache.Find(team_id)
	if err == nil {
		hash := integrity.Hash()
		c.Write(websocket.TextMessage, socket.JsonMessage(team_id, map[string]interface{}{
			"type": "integrity",
			"hash": hash,
			"ts": fmt.Sprintf("%d", time.Now().UTC().UnixNano()),
		}))
	}

	c.Write(websocket.TextMessage, socket.JsonMessage(team_id, map[string]interface{}{
		"type": "timesync",
		"ts": fmt.Sprintf("%d", time.Now().UTC().UnixNano()),
	}))

	socket.TeamHub.Register <- c
	go c.Writer()
	c.Reader(socket.TeamHub)
	// Reader could be used to:
	// - switch or add channels
	// - send chat messages
	// - update following integrity mismatch
}

func TeamIntegrity(w http.ResponseWriter, r *http.Request) {
	team_id := r.FormValue("team_id")
	ivs := r.FormValue("ivs")

	_, err := auth_team(w, r)
	if err != nil {
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", 405)
		return
	}

	iv_list := strings.Split(ivs, ",");

	integrity, err := model.TeamIntegrityCache.Find(team_id)
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
