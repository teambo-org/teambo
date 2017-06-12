package apptools

import (
	"os"
	"path/filepath"
	"strings"
	"io"
	"io/ioutil"
	"time"
	"bytes"
)

func RegisterAssets(r Registry, path string, assetPaths, testAssetPaths map[string][]string) {
	template_dir := "template"
	public_dir := "public"
	if path != "" {
		template_dir = path + string(os.PathSeparator) + template_dir
		public_dir = path + string(os.PathSeparator) + public_dir
	}

	templates, templatejs := CollectTemplates(template_dir)
	assets := CollectAssets(public_dir, assetPaths)

	assetRegistry := r.GetAssetRegistry()
	assetRegistry.AddAssets(assets)
	assetRegistry.AddTemplates(templates, templatejs)

	if r.GetConfig().Get("app.testing") == "true" {
		testAssets := CollectAssets(public_dir, testAssetPaths)
		testAssetRegistry := r.GetAssetTestRegistry()
		testAssetRegistry.AddAssets(assets)
		testAssetRegistry.AddAssets(testAssets)
		testAssetRegistry.AddTemplates(templates, templatejs)
	}
}

func CollectTemplates(basepath string) (templates map[string]string, templatejs map[string]string) {
	templates = map[string]string{}
	templatejs = map[string]string{}
	scan := func(path string, f os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		filename, _ := filepath.Rel(basepath, path)
		if !f.IsDir() && strings.Contains(filename, string(os.PathSeparator)) {
			tpl, _ := ioutil.ReadFile(path)
			if strings.HasSuffix(filename, ".mustache") {
				tplname := strings.TrimSuffix(filename, ".mustache")
				tplname = strings.Replace(tplname, string(os.PathSeparator), "/", -1)
				templates[tplname] = string(tpl)
			}
			if strings.HasSuffix(filename, ".js") {
				tplname := strings.TrimSuffix(filename, ".js")
				templatejs[tplname] = string(tpl)
			}
		}
		return nil
	}
	filepath.Walk(basepath, scan)
	return templates, templatejs
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
	return Asset {
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