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
	iv := r.FormValue("iv")
	ct := r.FormValue("ct")
	new_akey := r.FormValue("new_akey")
	pkey := r.FormValue("pkey")
	new_pkey := r.FormValue("new_pkey")

	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if akey == "" {
		error_out(w, "Email and password required", 400)
		return
	}

	acct, _ := model.FindAcct(id, akey)
	if acct.Ciphertext == "" {
		// TODO: Treat as failed login attempt for throttling
		error_out(w, "Account not found", 404)
		return
	}

	if !strings.HasPrefix(acct.Ciphertext, iv) {
		error_out(w, "Account version does not match", 409)
		return
	}

	if new_akey != "" && new_akey != akey {
		if akey == new_akey {
			error_out(w, "New access key must be different", 400)
			return
		}
		if pkey == "" {
			error_out(w, "Account protection token required", 400)
			return
		}
		if new_pkey == "" {
			error_out(w, "New account protection token required", 400)
			return
		}
		protection, err := model.FindAcctProtection(id, akey)
		if err != nil {
			error_out(w, "Account could not be saved", 500)
			return
		}
		if !protection.Validate(pkey) {
			// TODO: Treat as failed login attempt for throttling
			error_out(w, "Account protection token does not match", 403)
			return
		}
		new_acct, _ := model.FindAcct(id, new_akey)
		if new_acct.Ciphertext != "" {
			error_out(w, "Account already exists", 409)
			return
		}
		err = acct.Move(new_akey, new_pkey, ct)
		if err != nil {
			error_out(w, "Account could not be saved", 500)
			return
		}
	} else {
		err := acct.Update(ct)
		if err != nil {
			error_out(w, "Account could not be saved", 500)
			return
		}
	}

	parts := strings.Split(acct.Ciphertext, " ")
	acct_iv := parts[0]

	if acct.Akey != akey {
		socket.AcctHub.Broadcast <- socket.JsonMessagePure(acct.Hkey, map[string]interface{}{
			"moved": true,
		})
	} else {
		socket.AcctHub.Broadcast <- socket.JsonMessagePure(acct.Hkey, map[string]interface{}{
			"iv": acct_iv,
		})
	}

	res, _ := json.Marshal(acct)
	w.Write([]byte(string(res)))
}

func AcctAuth(w http.ResponseWriter, r *http.Request) {
	id := r.FormValue("id")
	akey := r.FormValue("akey")

	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if akey == "" {
		error_out(w, "Access Key required", 400)
		return
	}

	// TODO: Check authentication failure limit and disallow authentication if necessary

	acct, err := model.FindAcct(id, akey)
	if err != nil {
		error_out(w, "Account could not be retrieved", 500)
		return
	}
	if acct.Akey == "" || acct.Ciphertext == "new" {
		error_out(w, "Account not found", 404)
		return
	}

	res, _ := json.Marshal(acct)
	w.Write([]byte(string(res)))
}

func AcctSocket(w http.ResponseWriter, r *http.Request) {
	id := r.FormValue("id")
	akey := r.FormValue("akey")

	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if akey == "" {
		error_out(w, "Account Key is required", 400)
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

	c := socket.CreateConnection([]string{acct.Hkey}, ws)

	parts := strings.Split(acct.Ciphertext, " ")
	acct_iv := parts[0]

	if acct.Ciphertext == "" {
		c.Write(websocket.TextMessage, socket.JsonMessagePure(acct.Hkey, map[string]interface{}{
			"iv": "removed",
		}))
		return
	} else {
		c.Write(websocket.TextMessage, socket.JsonMessagePure(acct.Hkey, map[string]interface{}{
			"iv": acct_iv,
		}))
	}

	socket.AcctHub.Register <- c
	go c.Writer()
	c.Reader(socket.AcctHub)
}
