package controller

import (
	"encoding/json"
	"net/http"
)

func error_out(w http.ResponseWriter, msg string, status int) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	res, _ := json.Marshal(map[string]string{
		"error": msg,
	})
	http.Error(w, string(res), status)
	return
}
