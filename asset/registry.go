package asset

import (
	"../app/apptools"
	"io"
	"os"
	"bytes"
	"time"
	// "log"
)

var Registry = registry {
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
}

type registry struct {
	defaults map[string][]string
	Assets   map[string][]apptools.Asset
}

func (r *registry) Add(asset_type string, a apptools.Asset) {
	r.Assets[asset_type] = append(r.Assets[asset_type], a)
}

func (r *registry) Get(asset_type string) []apptools.Asset {
	if assets, ok := r.Assets[asset_type]; ok {
		return assets
	}
	return []apptools.Asset{}
}

func (r *registry) Init() {
	for asset_type, paths := range r.defaults {
		for _, path := range paths {
			r.Add(asset_type, makeAsset(path))
		}
	}
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

func makeAsset(path string) apptools.Asset {
	return apptools.Asset {
		Url: path,
		GetModTime: func() time.Time {
			stat, err := os.Stat("public" + path)
			if err != nil {
				return time.Now()
			}
			return stat.ModTime()
		},
		GetReader: func() io.Reader {
			r, err := os.Open("public" + path)
			if err == nil {
				return r
			}
			return bytes.NewReader(nil)
		},
	}
}
