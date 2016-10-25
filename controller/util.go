package controller

import (
	"../model"
	"encoding/json"
	"errors"
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

func auth_team(w http.ResponseWriter, r *http.Request) (team model.Team, err error) {
	team_id := r.FormValue("team_id")
	mkey := r.FormValue("mkey")

	members := model.TeamBucket{"member"}

	team, err = model.FindTeam(team_id)
	if err != nil {
		error_out(w, "Team could not be found", 500)
		return team, errors.New("")
	}
	if team.Id != team_id {
		error_out(w, "Team does not exist", 404)
		return team, errors.New("")
	}

	exists, err := members.Exists(team_id, mkey)
	if err != nil || !exists {
		error_out(w, "Team member not found", 403)
		return team, errors.New("")
	}

	return team, nil
}
