package controller

import (
	"../model"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
	"time"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512
)

type wsmessage struct {
	team_id string
	text    string
}

type hub struct {
	connections map[*connection]bool
	broadcast   chan wsmessage
	register    chan *connection
	unregister  chan *connection
}

var SocketHub = hub{
	broadcast:   make(chan wsmessage),
	register:    make(chan *connection),
	unregister:  make(chan *connection),
	connections: make(map[*connection]bool),
}

func (h *hub) Run() {
	// go func() {
	// for {
	// statsd.Counter(1.0, "gmob.sockets.open", len(h.connections))
	// time.Sleep(10 * time.Second)
	// }
	// }()
	for {
		select {
		case c := <-SocketHub.register:
			SocketHub.connections[c] = true
		case c := <-SocketHub.unregister:
			delete(h.connections, c)
			close(c.send)
		case m := <-SocketHub.broadcast:
			for c := range h.connections {
				if m.team_id == c.team_id {
					select {
					case c.send <- m:
					default:
						close(c.send)
						delete(SocketHub.connections, c)
					}
				}
			}
		}
	}
}

type connection struct {
	team_id string
	ws      *websocket.Conn
	send    chan wsmessage
}

func (c *connection) reader() {
	defer func() {
		SocketHub.unregister <- c
		c.ws.Close()
	}()
	c.ws.SetReadLimit(maxMessageSize)
	c.ws.SetReadDeadline(time.Now().Add(pongWait))
	c.ws.SetPongHandler(func(string) error { c.ws.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		_, _, err := c.ws.ReadMessage()
		if err != nil {
			break
		}
		//h.broadcast <- message
	}
}

func (c *connection) write(mt int, m wsmessage) error {
	c.ws.SetWriteDeadline(time.Now().Add(writeWait))
	return c.ws.WriteMessage(mt, []byte(m.text))
}

func (c *connection) writer() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.ws.Close()
	}()
	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				c.write(websocket.CloseMessage, wsmessage{"", ""})
				return
			}
			if err := c.write(websocket.TextMessage, message); err != nil {
				return
			}
		case <-ticker.C:
			if err := c.write(websocket.PingMessage, wsmessage{"", ""}); err != nil {
				return
			}
		}
	}
}

func Socket(w http.ResponseWriter, r *http.Request) {
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
	c := &connection{send: make(chan wsmessage, 256), ws: ws, team_id: team_id}
	logs, err := model.TeamLogSince(team_id, ts)
	if(err == nil) {
		for _, m := range logs {
			c.write(websocket.TextMessage, wsmessage{team_id, m})
		}
	}
	SocketHub.register <- c
	// Write log messages since last seen timestamp
	go c.writer()
	c.reader()
}
