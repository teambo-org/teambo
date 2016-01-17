package main

import (
	"encoding/json"
	"net/http"
	"errors"
	// "fmt"
)

func team_newId() (string) {
	id := randStr(8)

	exists, _ := team_exists(id)
	if exists {
		id = team_newId()
	}
	return id
}

func handle_team(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	
	id   := r.FormValue("id")
	akey := r.FormValue("akey")
	ct   := r.FormValue("ct")
	
	team := Team{}
	err  := errors.New("")

	if r.Method == "POST" {
		if id == "" && akey == "" {
			id   = team_newId()
			akey = randStr(8)
			team, err = team_save(id, akey, "new")
			if err != nil {
				error_out(w, "Team could not be created", 500)
				return
			}
		} else if len(id) > 0 && len(akey) > 0 && len(ct) > 0 {
			team, err = team_find(id, akey)
			if err != nil {
				error_out(w, "Team could not be found", 500)
				return
			}
			if team.Id != id {
				error_out(w, "Team does not exist", 404)
				return
			}
			team, err = team_save(id, akey, ct)
			if err != nil {
				error_out(w, "Team could not be saved", 500)
				return
			}
		} else {
			error_out(w, "Invalid Request", 400)
			return
		}
	} else {
		team, err = team_find(id, akey)
		if err != nil {
			error_out(w, "Team could not be found", 500)
			return
		}
		if team.Id != id {
			error_out(w, "Team does not exist", 404)
			return
		}
	}

	res, _ := json.Marshal(team)
	w.Write([]byte(string(res)))
}
