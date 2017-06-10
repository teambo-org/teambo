package service

import (
	"../model"
	"../socket"
	"time"
	// "log"
)

type purgeExpired struct {
	ticker  *time.Ticker
	running bool
}

var PurgeExpired = purgeExpired{
	running: false,
}

func (s *purgeExpired) Init() {
	s.ticker = time.NewTicker(15 * time.Minute)
	go func() {
		for _ = range s.ticker.C {
			s.Run()
		}
	}()
	return
}

func (s *purgeExpired) Stop() {
	s.ticker.Stop()
	if s.running {
		ticker := time.NewTicker(100 * time.Millisecond)
		for _ = range ticker.C {
			if !s.running {
				return
			}
		}
	}
	return
}

func (s *purgeExpired) Run() {
	if s.running {
		return
	}
	s.running = true
	model.AcctVerificationPurgeExpired()
	model.AcctThrottle.PurgeExpired()
	model.AcctThrottle.PurgeExpiredResets()
	model.BetaCodePurgeExpired()
	ids, _ := model.InvitePurgeExpired()
	for _, id := range ids {
		msg := socket.JsonMessage(id, map[string]interface{}{
			"expired": true,
		})
		socket.InviteResponseHub.Broadcast <- msg
		socket.InviteAcceptanceHub.Broadcast <- msg
	}
	s.running = false
}
