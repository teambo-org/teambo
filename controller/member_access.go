package controller

import (
	"../model"
	"encoding/json"
	"net/http"
	// "log"
)

func MemberAccess(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	id := r.FormValue("id")
	access_type := r.FormValue("type")

	team, member_id, err := auth_team(w, r)
	if err != nil {
		return
	}

	if member_id == id {
		error_out(w, "You may not modify your own access rules", 403)
		return
	}

	if !team.IsAdmin(member_id) {
		error_out(w, "Only a team admin can modify another member's access rules", 403)
		return
	}

	members := model.TeamBucket{team.Id, "member"}
	res := map[string]interface{}{}

	if r.Method == "POST" {
		member, err := members.Find(id)
		if err != nil {
			error_out(w, "Member could not be found", 500)
			return
		}
		if member.Id != id {
			error_out(w, "Member does not exist", 404)
			return
		}
		if access_type == "key" {
			memberKey, err := team.NewMemberKey(id)
			if err != nil {
				error_out(w, err.Error(), 500)
				return
			}
			err = memberKey.Save()
			if err != nil {
				error_out(w, "Team member could not be saved", 500)
				return
			}
			res["mkey"] = memberKey.Ciphertext
		} else {
			http.Error(w, "Unknown access type", 400)
			return
		}
	} else {
		http.Error(w, "Method not allowed", 405)
		return
	}

	resJson, _ := json.Marshal(res)
	w.Write([]byte(string(resJson)))
}
