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
	akey := r.FormValue("akey")
	ct := r.FormValue("ct")

	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if akey == "" {
		error_out(w, "Email and password required", 400)
		return
	}

	acct, _ := model.FindAcct(akey)
	if acct.Ciphertext == "" {
		error_out(w, "Account not found", 404)
		return
	}

	acct, err := model.CreateAcct(akey, ct)
	if err != nil {
		error_out(w, "Account could not be saved", 500)
		return
	}

	parts := strings.Split(ct, " ")
	acct_iv := parts[0]

	socket.AcctHub.Broadcast <- socket.JsonMessage(akey, map[string]interface{}{
		"iv": acct_iv,
	})

	res, _ := json.Marshal(acct)
	w.Write([]byte(string(res)))
}

func AcctAuth(w http.ResponseWriter, r *http.Request) {
	akey := r.FormValue("akey")

	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if akey == "" {
		error_out(w, "Access Key required", 400)
		return
	}

	// TODO: Check authentication failure limit and disallow authentication if necessary

	acct, err := model.FindAcct(akey)
	if err != nil {
		error_out(w, "Account could not be retrieved", 500)
		return
	}
	if acct.Akey == "" || acct.Ciphertext == "new" {
		error_out(w, "Account not found", 404)
	}

	res, _ := json.Marshal(acct)
	w.Write([]byte(string(res)))
}

func AcctSocket(w http.ResponseWriter, r *http.Request) {
	akey := r.FormValue("akey")

	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if akey == "" {
		error_out(w, "Account Key is required", 400)
		return
	}

	acct, err := model.FindAcct(akey)
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

	c := socket.CreateConnection([]string{akey}, ws)

	parts := strings.Split(acct.Ciphertext, " ")
	acct_iv := parts[0]

	if acct.Ciphertext == "" {
		c.Write(websocket.TextMessage, socket.JsonMessage(akey, map[string]interface{}{
			"iv": "removed",
		}))
		return
	} else {
		c.Write(websocket.TextMessage, socket.JsonMessage(akey, map[string]interface{}{
			"iv": acct_iv,
		}))
	}

	socket.AcctHub.Register <- c
	go c.Writer()
	c.Reader(socket.AcctHub)
}
