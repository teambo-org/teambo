package controller

import (
	"../model"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	// "fmt"
)

func Team(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	id := r.FormValue("id")
	iv := r.FormValue("iv")
	mkey := r.FormValue("mkey")
	ct := r.FormValue("ct")

	team := model.Team{}
	err := errors.New("")

	if r.Method == "POST" {
		if id == "" {
			team = model.NewTeam()
			err = team.Save()
			if err != nil {
				error_out(w, "Team could not be created", 500)
				return
			}
			member := team.NewMember()
			err = member.Save(team.Id)
			if err != nil {
				team.Remove()
				error_out(w, "Team member could not be saved", 500)
				return
			}
			mkey = member.Mkey
		} else if len(id) > 0 && len(mkey) > 0 && len(ct) > 0 && len(iv) > 0 {
			team, err = model.FindTeam(id)
			if err != nil {
				error_out(w, "Team could not be found", 500)
				return
			}
			if team.Id != id {
				error_out(w, "Team does not exist", 404)
				return
			}
			if !strings.HasPrefix(team.Ciphertext, iv) {
				error_out(w, "Team version does not match", 409)
				return
			}
			exists, err := model.TeamMemberExists(id, mkey)
			if err != nil || !exists {
				error_out(w, "Team member not found", 403)
				return
			}
			team.Ciphertext = ct
			err = team.Save()
			if err != nil {
				error_out(w, "Team could not be saved", 500)
				return
			}
		} else {
			error_out(w, "Invalid Request", 400)
			return
		}
	} else {
		team, err = model.FindTeam(id)
		if err != nil {
			error_out(w, "Team could not be found", 500)
			return
		}
		if team.Id != id {
			error_out(w, "Team does not exist", 404)
			return
		}
		exists, err := model.TeamMemberExists(id, mkey)
		if err != nil || !exists {
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
