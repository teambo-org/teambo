package controller

import (
	"../model"
	"../socket"
	"encoding/json"
	"net/http"
	"github.com/gorilla/websocket"
	"log"
	"strings"
	// "fmt"
)

func Acct(w http.ResponseWriter, r *http.Request) {
	id := r.FormValue("id")
	akey := r.FormValue("akey")
	ct := r.FormValue("ct")

	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if id == "" || akey == "" {
		error_out(w, "Email and password required", 400)
		return
	}

	acct, _ := model.FindAcct(id, akey)
	if acct.Id == "" {
		error_out(w, "Account not found", 404)
		return
	}

	acct, err := model.CreateAcct(id, akey, ct)
	if err != nil {
		error_out(w, "Account could not be saved", 500)
		return
	}

	parts := strings.Split(ct, " ")
	acct_iv := parts[0]

	socket.AcctHub.Broadcast <- socket.JsonMessage(id, map[string]interface{}{
		"iv": acct_iv,
	})

	res, _ := json.Marshal(acct)
	w.Write([]byte(string(res)))
}

func AcctAuth(w http.ResponseWriter, r *http.Request) {
	id := r.FormValue("id")
	akey := r.FormValue("akey")

	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if id == "" || akey == "" {
		error_out(w, "Email and password required", 400)
		return
	}

	// TODO: Check authentication failure limit and disallow authentication

	acct, err := model.FindAcct(id, akey)
	if err != nil {
		error_out(w, "Account could not be retrieved", 500)
		return
	}
	if acct.Id == "" || acct.Ciphertext == "new" {
		exists, _ := model.AcctExists(id)
		if exists {
			// Log failed authentication
			error_out(w, "Incorrect Password", 403)
		} else {
			error_out(w, "Account not found", 404)
		}
		return
	}

	res, _ := json.Marshal(acct)
	w.Write([]byte(string(res)))
}

func AcctSocket(w http.ResponseWriter, r *http.Request) {
	id := r.FormValue("id")
	akey := r.FormValue("akey")

	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if id == "" || akey == "" {
		error_out(w, "akey is required", 400)
		return
	}

	acct, err := model.FindAcct(id, akey)
	if err != nil {
		error_out(w, "Account could not be retrieved", 500)
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

	c := socket.CreateConnection([]string{id}, ws)

	parts := strings.Split(acct.Ciphertext, " ")
	acct_iv := parts[0]

	if acct.Ciphertext == "" {
		c.Write(websocket.TextMessage, socket.JsonMessage(id, map[string]interface{}{
			"iv": "removed",
		}))
		return
	} else {
		c.Write(websocket.TextMessage, socket.JsonMessage(id, map[string]interface{}{
			"iv": acct_iv,
		}))
	}

	socket.AcctHub.Register <- c
	c.Writer()
}
