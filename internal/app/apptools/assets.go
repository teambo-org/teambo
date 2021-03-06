package apptools

import (
	"bytes"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"
	// "log"
)

func RegisterAssets(r Registry, path string, assetPaths, testAssetPaths map[string][]string) {
	assets := CollectAssets(path, assetPaths)
	assetRegistry := r.GetAssetRegistry()
	assetRegistry.AddAssets(assets)
	if r.GetConfig().Get("app.testing") == "true" {
		testAssets := CollectAssets(path, testAssetPaths)
		testAssetRegistry := r.GetAssetTestRegistry()
		testAssetRegistry.AddAssets(assets)
		testAssetRegistry.AddAssets(testAssets)
	}
}

func RegisterTemplates(r Registry, path string, prefix string) {
	templates, templatejs := CollectTemplates(path)
	if len(prefix) > 0 {
		templates = PrefixAssetMapKey(prefix, templates)
		templatejs = PrefixAssetMapKey(prefix, templatejs)
	}
	r.GetAssetRegistry().AddTemplates(templates, templatejs)
	if r.GetConfig().Get("app.testing") == "true" {
		r.GetAssetTestRegistry().AddTemplates(templates, templatejs)
	}
}

func CollectTemplates(basepath string) (templates map[string]Asset, templatejs map[string]Asset) {
	templates = map[string]Asset{}
	templatejs = map[string]Asset{}
	scan := func(path string, f os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		filename, _ := filepath.Rel(basepath, path)
		if !f.IsDir() && strings.Contains(filename, string(os.PathSeparator)) {
			if strings.HasSuffix(filename, ".mustache") {
				tplname := strings.TrimSuffix(filename, ".mustache")
				tplname = strings.Replace(tplname, string(os.PathSeparator), "/", -1)
				templates[tplname] = makeAsset("", path)
			}
			if strings.HasSuffix(filename, ".js") {
				tplname := strings.TrimSuffix(filename, ".js")
				templatejs[tplname] = makeAsset("", path)
			}
		}
		return nil
	}
	filepath.Walk(basepath, scan)
	return templates, templatejs
}

func PrefixAssetMapKey(prefix string, assetMap map[string]Asset) map[string]Asset {
	ret := map[string]Asset{}
	for k, asset := range assetMap {
		ret[prefix+k] = asset
	}
	return ret
}

func SwapStringMapKeyPrefix(oldPfx, newPfx string, target map[string]string) map[string]string {
	swapped := map[string]string{}
	for k, v := range target {
		if strings.HasPrefix(k, oldPfx) {
			k = strings.TrimPrefix(k, oldPfx)
			swapped[newPfx+k] = v
		}
	}
	return swapped
}

func CollectAssets(prefix string, assetPaths map[string][]string) (assetMap map[string][]Asset) {
	assetMap = map[string][]Asset{}
	for asset_type, paths := range assetPaths {
		assetMap[asset_type] = []Asset{}
		for _, path := range paths {
			assetMap[asset_type] = append(assetMap[asset_type], makeAsset(prefix, path))
		}
	}
	return assetMap
}

func makeAsset(prefix, path string) Asset {
	return Asset{
		Url: path,
		GetModTime: func() time.Time {
			stat, err := os.Stat(prefix + path)
			if err != nil {
				return time.Now()
			}
			return stat.ModTime()
		},
		GetReader: func() io.Reader {
			r, err := os.Open(prefix + path)
			if err == nil {
				return r
			}
			return bytes.NewReader(nil)
		},
	}
}
