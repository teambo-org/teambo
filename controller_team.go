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
	mkey := r.FormValue("mkey")
	ct   := r.FormValue("ct")
	
	team := Team{}
	err  := errors.New("")

	if r.Method == "POST" {
		if id == "" {
			id = team_newId()
			team, err = team_save(id, "new")
			if err != nil {
				error_out(w, "Team could not be created", 500)
				return
			}
			mkey = randStr(8)
			_, err := team_member_save(id, mkey, "new")
			if err != nil {
				team_remove(id)
				error_out(w, "Team member could not be saved", 500)
				return
			}
		} else if len(id) > 0 && len(mkey) > 0 && len(ct) > 0 {
			team, err = team_find(id)
			if err != nil {
				error_out(w, "Team could not be found", 500)
				return
			}
			if team.Id != id {
				error_out(w, "Team does not exist", 404)
				return
			}
			exists, err := team_member_exists(id, mkey)
			if err != nil || !exists {
				// failed authentication
				error_out(w, "Team member not found", 403)
				return
			}
			team, err = team_save(id, ct)
			if err != nil {
				error_out(w, "Team could not be saved", 500)
				return
			}
		} else {
			error_out(w, "Invalid Request", 400)
			return
		}
	} else {
		team, err = team_find(id)
		if err != nil {
			error_out(w, "Team could not be found", 500)
			return
		}
		if team.Id != id {
			// failed authentication
			error_out(w, "Team does not exist", 404)
			return
		}
		exists, err := team_member_exists(id, mkey)
		if err != nil || !exists {
			// failed authentication
			error_out(w, "Team member not found", 403)
			return
		}
	}

	res, _ := json.Marshal(map[string]interface{}{
		"team": team,
		"mkey": mkey,
	})
	w.Write([]byte(string(res)))
}
