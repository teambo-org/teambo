package socket

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

func Init() {
	go TeamHub.Run()
	go InviteResponseHub.Run()
	go InviteAcceptanceHub.Run()
	go AcctHub.Run()
}
