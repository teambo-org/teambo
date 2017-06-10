package apps

import (
	"./wiki"
	// "github.com/teambo-org/wiki"
	"./apptools"
)

type Registry struct {
	Config apptools.Config
	DispatchHandler apptools.DispatchHandler
}

func (r Registry) GetDispatchHandler() apptools.DispatchHandler {
	return r.DispatchHandler
}

func (r Registry) GetConfig() apptools.Config {
	return r.Config
}

func (r Registry) Init() {
	apps := []apptools.App{
		wiki.App{},
	}
	for _, app := range apps {
		app.Init(r)
	}
}
