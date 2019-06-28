package controller

import (
	"encoding/json"
	"net/http"
	"strings"
	// "fmt"

	"github.com/teambo-org/teambo/internal/model"
	"github.com/teambo-org/teambo/internal/socket"
)

func Teams(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	team := model.Team{}
	res := map[string]interface{}{}

	if r.Method == "POST" {
		team = model.NewTeam()
		err := team.Save()
		if err != nil {
			error_out(w, "Team could not be created", 500)
			return
		}
		member := team.NewMember()
		err = member.Save()
		if err != nil {
			team.Remove()
			error_out(w, "Team member could not be saved", 500)
			return
		}
		memberKey, err := team.NewMemberKey(member.Id)
		if err != nil {
			error_out(w, err.Error(), 500)
			return
		}
		err = memberKey.Save()
		if err != nil {
			team.Remove()
			error_out(w, "Team member could not be saved", 500)
			return
		}
		mkey := memberKey.Ciphertext
		admin := team.NewAdmin(member.Id)
		admin.Ciphertext = mkey
		err = admin.Save()
		if err != nil {
			team.Remove()
			error_out(w, "Team member could not be saved", 500)
			return
		}
		res["member_id"] = member.Id
		res["mkey"] = mkey
		res["admin"] = true
	} else {
		http.Error(w, "Method not allowed", 405)
		return
	}

	res["team"] = team
	res_json, _ := json.Marshal(res)
	w.Write([]byte(string(res_json)))
}

func Team(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	ct := r.FormValue("ct")
	iv := r.FormValue("iv")

	team, member_id, err := auth_team(w, r)
	if err != nil {
		return
	}

	res := map[string]interface{}{}

	if r.Method == "POST" {
		if ct == "" || iv == "" {
			error_out(w, "Invalid Request", 400)
			return
		}
		if !strings.HasPrefix(team.Ciphertext, iv) {
			error_out(w, "Team version does not match", 409)
			return
		}
		if !team.IsAdmin(member_id) {
			error_out(w, "Only team admins may modify team settings", 403)
			return
		}
		team.Ciphertext = ct
		err = team.Save()
		if err != nil {
			error_out(w, "Team could not be saved", 500)
			return
		}
		parts := strings.Split(ct, " ")
		new_iv := parts[0]
		if new_iv != "new" {
			log_str, _ := team.Log(new_iv)
			logs := model.TeamLogParse([]string{log_str})
			socket.TeamHub.Broadcast <- socket.JsonMessage(team.Id, logs[0])
		}
	}

	res["admin"] = team.IsAdmin(member_id)
	res["team"] = team
	res_json, _ := json.Marshal(res)
	w.Write([]byte(string(res_json)))
}

func TeamRemove(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	id := r.FormValue("id")
	akey := r.FormValue("akey")
	pkey := r.FormValue("pkey")

	team, member_id, err := auth_team(w, r)
	if err != nil {
		return
	}

	if !team.IsAdmin(member_id) {
		error_out(w, "Only a team admin can delete a team", 403)
		return
	}

	if model.AcctThrottle.Remaining(id) < 1 {
		error_data(w, 403, map[string]interface{}{
			"error": "Account is locked",
			"code":  "acct_locked",
		})
		return
	}

	if r.Method == "POST" {
		protection, err := model.FindAcctProtection(id, akey)
		if err != nil {
			error_out(w, "Account protection could not be verified", 500)
			return
		}
		if !protection.Validate(pkey) {
			model.AcctThrottle.Log(id)
			error_out(w, "Account protection key does not match", 403)
			return
		}

		err = team.Remove()
		if err != nil {
			error_out(w, "Team could not be removed", 500)
			return
		}
	} else {
		error_out(w, "Method not allowed.", 405)
		return
	}

	w.WriteHeader(204)
	return
}

func TeamSummary(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	ts := r.FormValue("ts")

	team, _, err := auth_team(w, r)
	if err != nil {
		return
	}

	res, _ := json.Marshal(map[string]interface{}{
		"logs": model.TeamLogCount(team.Id, ts),
	})
	w.Write([]byte(string(res)))
}
