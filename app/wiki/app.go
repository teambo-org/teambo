package wiki

import (
	// "strings"
	// "log"

	"github.com/teambo-org/teambo/app/apptools"
)

//go:generate go run ../apptools/apptools-compile/main.go -pkg wiki -templates template -assets js,css

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

	// Read assets directly from filesystem (dev mode)
	apptools.RegisterAssets(r, "app/wiki", asset_paths, test_asset_paths)
	apptools.RegisterTemplates(r, "app/wiki/template", "app/")

	// Read compiled assets after go generate
	// apptools.RegisterCompiledAssets(r, asset_paths, test_asset_paths, _compiled_assets)
	// apptools.RegisterCompiledTemplates(r,
	// apptools.SwapStringMapKeyPrefix("template", "app", _compiled_templates),
	// apptools.SwapStringMapKeyPrefix("template", "app", _compiled_templatejs))
}
