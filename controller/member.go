package controller

import (
	"../model"
	"../socket"
	"encoding/json"
	"net/http"
	"strings"
	// "log"
)

func Member(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	team_id := r.FormValue("team_id")
	id := r.FormValue("id")
	ct := r.FormValue("ct")
	iv := r.FormValue("iv")

	_, err := auth_team(w, r)
	if err != nil {
		return
	}

	members := model.TeamBucket{team_id, "member"}
	obj := model.TeamObject{}

	if r.Method == "POST" {
		if len(id) > 0 && len(ct) > 0 {
			obj, err = members.Find(id)
			if err != nil {
				error_out(w, strings.Title("member")+" could not be found", 500)
				return
			}
			if obj.Id != id {
				error_out(w, strings.Title("member")+" does not exist", 404)
				return
			}
			if !strings.HasPrefix(obj.Ciphertext, iv) {
				error_out(w, "Team version does not match", 409)
				return
			}
			obj.Ciphertext = ct
			err = obj.Save()
			if err != nil {
				error_out(w, strings.Title("member")+" could not be saved", 500)
				return
			}

			parts := strings.Split(ct, " ")
			new_iv := parts[0]
			if true && new_iv != "new" {
				log, _ := obj.Log(new_iv)
				socket.TeamHub.Broadcast <- socket.Message(team_id, log)
			}
		} else {
			error_out(w, "Invalid Request", 400)
			return
		}
	} else {
		obj, err = members.Find(id)
		if err != nil {
			error_out(w, strings.Title("member")+" could not be found", 500)
			return
		}
		if obj.Id != id {
			error_out(w, strings.Title("member")+" does not exist", 404)
			return
		}
	}

	res, _ := json.Marshal(obj)
	w.Write([]byte(string(res)))
}

func MemberRemove(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	team_id := r.FormValue("team_id")
	mkey := r.FormValue("mkey")
	id := r.FormValue("id")
	comment_ids := r.FormValue("comment_ids")

	team, err := auth_team(w, r)
	if err != nil {
		return
	}

	members     := model.TeamBucket{team_id, "member"}
	comments    := model.TeamBucket{team_id, "comment"}
	member_keys := model.TeamBucket{team_id, "member_key"}

	if r.Method == "POST" {
		if len(id) > 0 {
			obj, err := members.Find(id)
			if err != nil {
				error_out(w, strings.Title("member")+" could not be found", 500)
				return
			}
			if obj.Id != id {
				error_out(w, strings.Title("member")+" does not exist", 404)
				return
			}

			member_id := team.GetMemberId(mkey)
			if member_id != id && !team.IsAdmin(mkey) {
				error_out(w, "Only a team admin or owning member may remove this member", 403)
				return
			}
			err = obj.Remove()
			if err != nil {
				error_out(w, strings.Title("member")+" could not be removed", 500)
				return
			}
			member_keys.RemoveByValue(id)
			if comment_ids != "" {
				ids := strings.Split(comment_ids, ",")
				for _, comment_id := range ids {
					comment, err := comments.Find(comment_id)
					if err == nil {
						err = comment.Remove()
						if err == nil {
							log, _ := comment.Log("removed")
							socket.TeamHub.Broadcast <- socket.Message(team_id, log)
						}
					}
				}
			}
			log, _ := obj.Log("removed")
			socket.TeamHub.Broadcast <- socket.Message(team_id, log)
		} else {
			error_out(w, "Invalid Request", 400)
			return
		}
	} else {
		error_out(w, "Method not allowed.", 405)
		return
	}

	w.WriteHeader(204)
	return
}

func Members(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	team_id := r.FormValue("team_id")
	mkey := r.FormValue("mkey")
	id := r.FormValue("id")

	team, err := auth_team(w, r)
	if err != nil {
		return
	}

	members := model.TeamBucket{team_id, "member"}

	res := []byte{}

	if r.Method == "POST" {
		obj := model.TeamObject{}

		if id == "" {
			if !team.IsAdmin(mkey) {
				error_out(w, "Only a team admin can create a new Member", 403)
				return
			}
			obj = members.NewObject("")
			err = obj.Save()
			if err != nil {
				error_out(w, "Object could not be created", 500)
				return
			}
		} else {
			obj = members.NewObject(id)
			if obj.Id != id {
				error_out(w, "Object already exists", 409)
				return
			}
			obj.Ciphertext = "new"
			err = obj.Save()
			if err != nil {
				error_out(w, "Object could not be saved", 500)
				return
			}
		}

		res, _ = json.Marshal(obj)
	} else {
		objs, err := members.All()

		if err != nil {
			error_out(w, "Object could not be found", 500)
			return
		}

		res, _ = json.Marshal(objs)
	}

	w.Write([]byte(string(res)))
}
