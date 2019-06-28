package asset

import (
	"io/ioutil"

	"github.com/teambo-org/teambo/internal/app/apptools"
)

var Registry = registry{
	defaults: map[string][]string{
		"jsapp":   jsapp,
		"jslib":   jslib,
		"jsasync": jsasync,
		"jsinit":  jsinit,
		"cssapp":  cssapp,
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

type registry struct {
	defaults   map[string][]string
	Assets     map[string][]apptools.Asset
	Templates  map[string]apptools.Asset
	Templatejs map[string]apptools.Asset
}

func (r *registry) Init() {
	r.AddAssets(apptools.CollectAssets("public", r.defaults))
	r.AddTemplates(apptools.CollectTemplates("template"))
}

func (r *registry) Add(asset_type string, a apptools.Asset) {
	r.Assets[asset_type] = append(r.Assets[asset_type], a)
}

func (r *registry) AddAssets(assetMap map[string][]apptools.Asset) {
	for asset_type, assets := range assetMap {
		for _, asset := range assets {
			r.Add(asset_type, asset)
		}
	}
}

func (r *registry) AddTemplates(templates, templatejs map[string]apptools.Asset) {
	for k, v := range templates {
		r.Templates[k] = v
	}
	for k, v := range templatejs {
		r.Templatejs[k] = v
	}
}

func (r *registry) Get(asset_type string) []apptools.Asset {
	if assets, ok := r.Assets[asset_type]; ok {
		return assets
	}
	return []apptools.Asset{}
}

func (r *registry) Find(path string) apptools.Asset {
	for _, assets := range r.Assets {
		for _, a := range assets {
			if a.Url == path {
				return a
			}
		}
	}
	return apptools.Asset{}
}

func (r *registry) ResolveTemplates() map[string]string {
	templates := map[string]string{}
	for k, asset := range r.Templates {
		template, err := ioutil.ReadAll(asset.GetReader())
		if err == nil {
			templates[k] = string(template)
		}
	}
	return templates
}

func (r *registry) ResolveTemplatejs() map[string]string {
	templates := map[string]string{}
	for k, asset := range r.Templatejs {
		template, err := ioutil.ReadAll(asset.GetReader())
		if err == nil {
			templates[k] = string(template)
		}
	}
	return templates
}
