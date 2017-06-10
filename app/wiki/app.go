package wiki

import (
	//"github.com/teambo-org/apptools"
	"../apptools"
	// "net/http"
	"os"
	"io"
	"bytes"
	"time"
	// "log"
)

type App struct {
	apptools.App
}

var assets = map[string][]string{
	"jsapp": []string{
		"/js/model/wiki.js",
	},
}
var test_assets = map[string][]string{}

func (app App) Init(r apptools.Registry) {
	dh := r.GetDispatchHandler()
	dh.AddTeamObject("wiki", true)

	registerAssets(r)
}

func registerAssets(r apptools.Registry) {
	assetRegistry := r.GetAssetRegistry()
	assetTestRegistry := r.GetAssetTestRegistry()
	for asset_type, paths := range assets {
		for _, path := range paths {
			asset := makeAsset(path)
			assetRegistry.Add(asset_type, asset)
			assetTestRegistry.Add(asset_type, asset)
		}
	}
	for asset_type, paths := range test_assets {
		for _, path := range paths {
			asset := makeAsset(path)
			assetRegistry.Add(asset_type, asset)
			assetTestRegistry.Add(asset_type, asset)
		}
	}
}

func makeAsset(path string) apptools.Asset {
	return apptools.Asset {
		Url: path,
		GetModTime: func() time.Time {
			stat, err := os.Stat("app/wiki/public" + path)
			if err != nil {
				return time.Now()
			}
			return stat.ModTime()
		},
		GetReader: func() io.Reader {
			r, err := os.Open("app/wiki/public" + path)
			if err == nil {
				return r
			}
			return bytes.NewReader(nil)
		},
	}
}
