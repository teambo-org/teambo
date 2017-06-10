package apps

import (
	"../dispatch"
	"./wiki"
	// "github.com/teambo-org/wiki"
	// "log"
)

type App interface {
	Init(*dispatch.Handler)
}

type Registry struct {
	DispatchHandler *dispatch.Handler
	// Attach javascript files
	// Attach stylesheets
	// Attach templates
}

func (r *Registry) Init() {
	apps := []App{
		wiki.App{},
	}
	for _, app := range apps {
		app.Init(r.DispatchHandler)
	}
}
