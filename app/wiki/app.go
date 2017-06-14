package wiki

import (
	"../apptools"
	"strings"
	// "log"
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

	// apptools.RegisterAssets(r, "app/wiki", asset_paths, test_asset_paths)
	// apptools.RegisterTemplates(r, "app/wiki/template", "app/")

	apptools.RegisterCompiledAssets(r, asset_paths, test_asset_paths, _compiled_assets)
	apptools.RegisterCompiledTemplates(r,
		cleanPrefix("template", "app", _compiled_templates),
		cleanPrefix("template", "app", _compiled_templatejs))
}

func cleanPrefix(oldPfx, newPfx string, target map[string]string) map[string]string {
	cleaned := map[string]string{}
	for k, v := range target {
		k = strings.TrimPrefix(k, oldPfx)
		cleaned[newPfx+k] = v
	}
	return cleaned
}
