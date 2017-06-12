package apptools

import (
	"net/http"
	"io"
	"time"
)

type App interface {
	Init(Registry)
}

type Registry interface {
	Init()
	GetConfig() Config
	GetDispatchHandler() DispatchHandler
	GetAssetRegistry() AssetRegistry
	GetAssetTestRegistry() AssetRegistry
}

type DispatchHandler interface {
	Attach(func(func(w http.ResponseWriter, r *http.Request)) func(w http.ResponseWriter, r *http.Request))
	AddTeamObject(string, bool)
}

type AssetRegistry interface {
	Add(string, Asset)
	AddAssets(map[string][]Asset)
	AddTemplates(map[string]string, map[string]string)
}

type Asset struct {
	Url string
	GetModTime func()time.Time
	GetReader func()io.Reader
}

type Config interface {
	Get(key string) string
}
