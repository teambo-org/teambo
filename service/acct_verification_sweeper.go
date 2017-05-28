package service

import (
	"../model"
	"time"
	// "log"
)

type acctVerificationSweeper struct {
	ticker   *time.Ticker
	running  bool
}

var AcctVerificationSweeper = acctVerificationSweeper{
	running: false,
}

func (sw *acctVerificationSweeper) Init() {
	sw.ticker = time.NewTicker(15 * time.Minute)
	go func() {
		for _ = range sw.ticker.C {
			sw.Run()
		}
	}()
	return
}

func (sw *acctVerificationSweeper) Stop() {
	sw.ticker.Stop()
	if sw.running {
		ticker := time.NewTicker(100 * time.Millisecond)
		for _ = range ticker.C {
			if !sw.running {
				return
			}
		}
	}
	return
}

func (sw *acctVerificationSweeper) Run() {
	if sw.running {
		return
	}
	sw.running = true
	model.AcctVerificationPurgeExpired()
	sw.running = false
}
