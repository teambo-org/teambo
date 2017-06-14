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
		"/js/app/wiki.js",
	},
	"cssapp": []string{
		"/css/wiki.css",
	},
}
var test_asset_paths = map[string][]string{}

func (app App) Init(r apptools.Registry) {
	r.GetDispatchHandler().AddTeamObject("wiki", true)
	apptools.RegisterAssets(r, "app/wiki", asset_paths, test_asset_paths)
	apptools.RegisterTemplates(r, "app/wiki/template", "app/")
}
