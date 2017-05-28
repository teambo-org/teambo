package service

import (
	"../model"
	"../socket"
	"time"
	// "log"
)

type inviteSweeper struct {
	ticker   *time.Ticker
	running  bool
	stop     bool
}

var InviteSweeper = inviteSweeper{
	running: false,
	stop:    false,
}

func (is *inviteSweeper) Init() {
	is.ticker = time.NewTicker(15 * time.Minute)
	go func() {
		for _ = range is.ticker.C {
			if is.stop {
				return
			}
			is.Run()
		}
	}()
	return
}

func (is *inviteSweeper) Stop() {
	is.stop = true
	is.ticker.Stop()
	if is.running {
		ticker := time.NewTicker(100 * time.Millisecond)
		for _ = range ticker.C {
			if !is.running {
				return
			}
		}
	}
	return
}

func (is *inviteSweeper) Run() {
	if is.running {
		return
	}
	is.running = true
	expired, _ := model.InviteFindExpired()
	for _, exp := range expired {
		if is.stop {
			return
		}
		exp.Invite.Delete()
		msg := socket.JsonMessage(exp.Invite.Id, map[string]interface{}{
			"expired": true,
		})
		socket.InviteResponseHub.Broadcast <- msg
		socket.InviteAcceptanceHub.Broadcast <- msg
		exp.Delete()
	}
	is.running = false
}
