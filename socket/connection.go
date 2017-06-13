package socket

import (
	"github.com/gorilla/websocket"
	"time"
)

func CreateConnection(ids []string, ws *websocket.Conn) *connection {
	return &connection{channel_ids: ids, ws: ws, send: make(chan wsmessage, 256)}
}

type connection struct {
	channel_ids []string
	ws          *websocket.Conn
	send        chan wsmessage
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
	defer func() {
		pinger.Stop()
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
		}
	}
}
