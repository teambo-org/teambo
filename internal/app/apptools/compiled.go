package apptools

import (
	"bytes"
	"io"
	"time"
	// "log"
)

func RegisterCompiledAssets(r Registry, assetPaths, testAssetPaths map[string][]string, assets map[string]string) {
	assetRegistry := r.GetAssetRegistry()
	for asset_type, paths := range assetPaths {
		for _, path := range paths {
			if asset, ok := assets[path]; ok {
				assetRegistry.Add(asset_type, makeCompiledAsset(path, asset))
			}
		}
	}
}

func RegisterCompiledTemplates(r Registry, compiled_templates, compiled_templatejs map[string]string) {
	templates := map[string]Asset{}
	templatejs := map[string]Asset{}
	for name, file := range compiled_templates {
		templates[name] = makeCompiledAsset(name, file)
	}
	for name, file := range compiled_templatejs {
		templatejs[name] = makeCompiledAsset(name, file)
	}
	r.GetAssetRegistry().AddTemplates(templates, templatejs)
	if r.GetConfig().Get("app.testing") == "true" {
		r.GetAssetTestRegistry().AddTemplates(templates, templatejs)
	}
}

func makeCompiledAsset(path string, file string) Asset {
	return Asset{
		Url: path,
		GetModTime: func() time.Time {
			return time.Now()
		},
		GetReader: func() io.Reader {
			return bytes.NewReader([]byte(file))
		},
	}
}
