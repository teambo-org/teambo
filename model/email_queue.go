package model

import (
	// "log"
	"../util"
	"time"
	"sync"
)

type emailQueue struct {
	queue       []email
	mutex       *sync.Mutex
	processing  bool
	maxAttempts int64
}

var EmailQueue = emailQueue {
	queue:       []email{},
	mutex:       &sync.Mutex{},
	processing:  false,
	maxAttempts: 4,
}

type email struct {
	To       string
	Subject  string
	Body     string
	Attempts int64
}

func (eq *emailQueue) Init() {
	ticker := time.NewTicker(time.Second)
	go func() {
		for _ = range ticker.C {
			eq.ProcessQueue()
		}
	}()
	return
}

func (eq *emailQueue) ProcessQueue() {
	if eq.processing {
		return
	}
	eq.mutex.Lock()
	eq.processing = true
	queue := eq.queue
	eq.queue = []email{}
	eq.mutex.Unlock()
	for _, e := range queue {
		err := util.SendMail(e.To, e.Subject, e.Body)
		if err != nil && e.Attempts < eq.maxAttempts {
			e.Attempts += 1
			eq.mutex.Lock()
			eq.queue = append(eq.queue, e)
			eq.mutex.Unlock()
		}
	}
	// fire statsd timer
	// fire statsd average
	eq.processing = false
}

func (eq *emailQueue) Push(to string, subject string, body string) (e email, err error) {
	// fire statsd counter increment
	e = email{to, subject, body, 0}
	eq.mutex.Lock()
	eq.queue = append(eq.queue, e)
	eq.mutex.Unlock()
	return e, nil
}
