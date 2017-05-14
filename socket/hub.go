package socket

import (
	// "fmt"
	"github.com/gorilla/websocket"
	"log"
	// "net/http"
	"time"
	"encoding/json"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	timeSyncPeriod = 60 * time.Second
	maxMessageSize = 512
)

type wsmessage struct {
	channel_id string
	text       string
}

func Message(channel_id string, text string) wsmessage {
	return wsmessage{channel_id, channel_id + "-" + text}
}

func JsonMessage(channel_id string, data map[string]interface{}) wsmessage {
	data["channel_id"] = channel_id
	json_bytes, _ := json.Marshal(data)
	return wsmessage{channel_id, string(json_bytes)}
}

type hub struct {
	connections map[string]map[*connection]bool
	Broadcast   chan wsmessage
	Register    chan *connection
	unregister  chan *connection
}

var TeamHub = hub{
	connections: make(map[string]map[*connection]bool),
	Broadcast:   make(chan wsmessage),
	Register:    make(chan *connection),
	unregister:  make(chan *connection),
}

var InviteResponseHub = hub{
	connections: make(map[string]map[*connection]bool),
	Broadcast:   make(chan wsmessage),
	Register:    make(chan *connection),
	unregister:  make(chan *connection),
}

var InviteAcceptanceHub = hub{
	connections: make(map[string]map[*connection]bool),
	Broadcast:   make(chan wsmessage),
	Register:    make(chan *connection),
	unregister:  make(chan *connection),
}

var AcctHub = hub{
	connections: make(map[string]map[*connection]bool),
	Broadcast:   make(chan wsmessage),
	Register:    make(chan *connection),
	unregister:  make(chan *connection),
}

func (h *hub) Run() {
	// go func() {
	// for {
	// statsd.Counter(1.0, "sockets.open", len(h.connections))
	// time.Sleep(10 * time.Second)
	// }
	// }()
	for {
		select {
		case c := <-h.Register:
			for _, id := range c.channel_ids {
				if _, ok := h.connections[id]; !ok {
					h.connections[id] = make(map[*connection]bool)
				}
				h.connections[id][c] = true
			}
		case c := <-h.unregister:
			for _, id := range c.channel_ids {
				delete(h.connections[id], c)
			}
			close(c.send)
		case m := <-h.Broadcast:
			if connections, ok := h.connections[m.channel_id]; ok {
				for c := range connections {
					log.Print("Sending Message: ")
					log.Println(m)
					select {
					case c.send <- m:
					default:
						close(c.send)
						delete(connections, c)
					}
				}
			}
		}
	}
}

func CreateConnection(ids []string, ws *websocket.Conn) *connection {
	return &connection{channel_ids: ids, ws: ws, send: make(chan wsmessage, 256)}
}

type connection struct {
	channel_ids  []string
	ws           *websocket.Conn
	send         chan wsmessage
}

func (c *connection) Reader(hub hub) {
	defer func() {
		hub.unregister <- c
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
		//h.Broadcast <- message
	}
}

func (c *connection) Write(mt int, m wsmessage) error {
	c.ws.SetWriteDeadline(time.Now().Add(writeWait))
	return c.ws.WriteMessage(mt, []byte(m.text))
}

func (c *connection) Writer() {
	pinger := time.NewTicker(pingPeriod)
	timesync := time.NewTicker(timeSyncPeriod)
	defer func() {
		pinger.Stop()
		timesync.Stop()
		c.ws.Close()
	}()
	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				c.Write(websocket.CloseMessage, wsmessage{"", ""})
				return
			}
			if err := c.Write(websocket.TextMessage, message); err != nil {
				return
			}
		case <-pinger.C:
			if err := c.Write(websocket.PingMessage, wsmessage{"", ""}); err != nil {
				return
			}
		case <-timesync.C:
			var msg = JsonMessage("", map[string]interface{}{"type": "timesync"})
			if err := c.Write(websocket.TextMessage, msg); err != nil {
				return
			}
		}
	}
}