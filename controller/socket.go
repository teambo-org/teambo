package controller

import (
	"../model"
	"../socket"
	"fmt"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
	"time"
)

func TeamSocket(w http.ResponseWriter, r *http.Request) {
	team_id := r.FormValue("team_id")
	ts := r.FormValue("ts")

	_, err := auth_team(w, r)
	if err != nil {
		return
	}

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
	c := socket.CreateConnection([]string{team_id}, ws)
	if ts != "0" && ts != "" {
		logs, err := model.TeamLogSince(team_id, ts)
		if err == nil {
			for _, m := range logs {
				c.Write(websocket.TextMessage, socket.Message(team_id, m))
			}
		}
	}
	c.Write(websocket.TextMessage, socket.Message(team_id, fmt.Sprintf("%d", time.Now().UTC().UnixNano()/int64(time.Millisecond))))
	socket.TeamHub.Register <- c
	go c.Writer()
	c.Reader(socket.TeamHub)
}
