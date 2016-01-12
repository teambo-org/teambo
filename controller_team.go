package main

import (
	"encoding/json"
	"net/http"
	// "fmt"
)

func team_unusedSha() (string, string) {
	hash := randSha()
	akey := randSha()

	team, _ := team_find(hash, akey)
	if team.Hash != "" {
		hash, akey = team_unusedSha()
	}
	return hash, akey
}

func handle_team(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if r.Method != "POST" {
		msg, _ := json.Marshal(map[string]string{
			"error": "Method not allowed",
		})
		http.Error(w, string(msg), 405)
		return
	}

	hash, akey := team_unusedSha()

	team, err := team_save(hash, akey, "new")
	if err != nil {
		msg, _ := json.Marshal(map[string]string{
			"error": "Team could not be created",
		})
		http.Error(w, string(msg), 500)
		return
	}

	res, _ := json.Marshal(team)
	w.Write([]byte(string(res)))
}
