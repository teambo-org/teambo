package asset

import (
	"../app/apptools"
)

var TestRegistry = registry{
	defaults: map[string][]string{
		"jsapp":   jsapp_test,
		"jslib":   jslib_test,
		"jsasync": jsasync,
		"jsinit":  jsinit,
		"cssapp":  cssapp_test,
		"csslib":  csslib,
	},
	Assets: map[string][]apptools.Asset{
		"jsapp":   []apptools.Asset{},
		"jslib":   []apptools.Asset{},
		"jsasync": []apptools.Asset{},
		"jsinit":  []apptools.Asset{},
		"cssapp":  []apptools.Asset{},
		"csslib":  []apptools.Asset{},
	},
	Templates:  make(map[string]apptools.Asset),
	Templatejs: make(map[string]apptools.Asset),
}
