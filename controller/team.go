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

	team_id := r.FormValue("team_id")
	iv := r.FormValue("iv")
	mkey := r.FormValue("mkey")
	ct := r.FormValue("ct")

	team := model.Team{}
	err := errors.New("")
	res := map[string]interface{}{}

	if r.Method == "POST" {
		if team_id == "" {
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
			res["mkey"] = mkey
		} else if len(team_id) > 0 && len(mkey) > 0 && len(ct) > 0 && len(iv) > 0 {
			team, err = auth_team(w, r)
			if err != nil {
				return
			}
			if !strings.HasPrefix(team.Ciphertext, iv) {
				error_out(w, "Team version does not match", 409)
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
		team, err = auth_team(w, r)
		if err != nil {
			return
		}
	}

	res["team"] = team
	res_json, _ := json.Marshal(res)
	w.Write([]byte(string(res_json)))
}
