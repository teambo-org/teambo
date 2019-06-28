package controller

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io/ioutil"
	"net/http"
	// "log"

	"github.com/teambo-org/teambo/internal/model"
)

func error_out(w http.ResponseWriter, msg string, status int) {
	error_data(w, status, map[string]interface{}{
		"error": msg,
	})
	return
}

func error_data(w http.ResponseWriter, status int, data map[string]interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	res, _ := json.Marshal(data)
	http.Error(w, string(res), status)
	return
}

func auth_team(w http.ResponseWriter, r *http.Request) (team model.Team, member_id string, err error) {
	team_id := r.Header.Get("teambo-team-id")

	if team_id == "" {
		error_out(w, "Team ID Required", 400)
		return team, member_id, errors.New("")
	}

	team, err = model.FindTeam(team_id)
	if err != nil {
		error_out(w, "Team could not be found", 500)
		return team, member_id, errors.New("")
	}
	if team.Id != team_id {
		error_out(w, "Team does not exist", 404)
		return team, member_id, errors.New("")
	}

	member_id = r.Header.Get("teambo-member-id")
	signature := r.Header.Get("teambo-member-sig")
	if member_id == "" || signature == "" {
		error_out(w, "Request signature required", 401)
		return team, member_id, errors.New("")
	}

	body, _ := ioutil.ReadAll(r.Body)
	member_keys := model.TeamBucket{team.Id, "member_key"}
	member_key, _ := member_keys.Find(member_id)
	h := sha256.New()
	h.Write([]byte(r.URL.String()))
	h.Write(body)
	h.Write([]byte(member_key.Ciphertext))
	sig := base64.StdEncoding.EncodeToString(h.Sum(nil))

	if signature != sig {
		error_out(w, "Request signature invalid", 403)
		return team, member_id, errors.New("")
	}

	return team, member_id, nil
}
