package wiki

import (
	"../apptools"
)

type App struct {
	apptools.App
}

var asset_paths = map[string][]string{
	"jsapp": []string{
		"/js/model/wiki.js",
		"/js/apps/wiki.js",
	},
	"cssapp": []string{
		"/css/wiki.css",
	},
}
var test_asset_paths = map[string][]string{}

func (app App) Init(r apptools.Registry) {
	dh := r.GetDispatchHandler()
	dh.AddTeamObject("wiki", true)
	apptools.RegisterAssets(r, "app/wiki", asset_paths, test_asset_paths)
}
