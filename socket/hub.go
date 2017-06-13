package socket

import (
	"time"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	timeSyncPeriod = 60 * time.Second
	maxMessageSize = 512
)

type hub struct {
	connections map[string]map[*connection]bool
	Broadcast   chan wsmessage
	Register    chan *connection
	unregister  chan *connection
}

func (h *hub) Run() {
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
