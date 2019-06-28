package controller

import (
	"encoding/json"
	"net/http"
	"regexp"
	"strings"
	// "log"

	"github.com/teambo-org/teambo/internal/model"
	"github.com/teambo-org/teambo/internal/socket"
)

func Member(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	id := r.FormValue("id")
	ct := r.FormValue("ct")
	iv := r.FormValue("iv")

	team, member_id, err := auth_team(w, r)
	if err != nil {
		return
	}

	if member_id != id && !team.IsAdmin(member_id) {
		error_out(w, "Only a team admin or owning member may modify this member", 403)
		return
	}

	members := model.TeamBucket{team.Id, "member"}
	obj := model.TeamObject{}

	if r.Method == "POST" {
		if id == "" || ct == "" {
			error_out(w, "Object ID and Ciphertext must be specified", 400)
			return
		}

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
			error_out(w, "Object version does not match", 409)
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
			log_str, _ := obj.Log(new_iv)
			logs := model.TeamLogParse([]string{log_str})
			socket.TeamHub.Broadcast <- socket.JsonMessage(team.Id, logs[0])
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

	id := r.FormValue("id")
	comment_ids := r.FormValue("comment_ids")

	team, member_id, err := auth_team(w, r)
	if err != nil {
		return
	}

	if member_id != id && !team.IsAdmin(member_id) {
		error_out(w, "Only a team admin or owning member may remove a member", 403)
		return
	}

	members := model.TeamBucket{team.Id, "member"}
	comments := model.TeamBucket{team.Id, "comment"}
	member_keys := model.TeamBucket{team.Id, "member_key"}

	if r.Method == "POST" {
		if id == "" {
			error_out(w, "Invalid Request", 400)
			return
		}
		obj, err := members.Find(id)
		if err != nil {
			error_out(w, strings.Title("member")+" could not be found", 500)
			return
		}
		if obj.Id != id {
			error_out(w, strings.Title("member")+" does not exist", 404)
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
						log_str, _ := comment.Log("removed")
						logs := model.TeamLogParse([]string{log_str})
						socket.TeamHub.Broadcast <- socket.JsonMessage(team.Id, logs[0])
					}
				}
			}
		}
		log_str, _ := obj.Log("removed")
		logs := model.TeamLogParse([]string{log_str})
		socket.TeamHub.Broadcast <- socket.JsonMessage(team.Id, logs[0])
	} else {
		error_out(w, "Method not allowed.", 405)
		return
	}

	w.WriteHeader(204)
	return
}

func Members(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	id := r.FormValue("id")
	ct := r.FormValue("ct")

	team, member_id, err := auth_team(w, r)
	if err != nil {
		return
	}

	members := model.TeamBucket{team.Id, "member"}

	res := []byte{}

	if r.Method == "POST" {
		obj := model.TeamObject{}

		if !team.IsAdmin(member_id) {
			error_out(w, "Only a team admin can create a new Member", 403)
			return
		}

		if id == "" || ct == "" {
			error_out(w, "Object ID and Ciphertext must be specified", 400)
			return
		}

		id_regex := "^[0-9a-zA-Z]{8}$"
		match, err := regexp.MatchString(id_regex, id)
		if !match {
			http.Error(w, "Malformed Object ID", 400)
			return
		}
		if members.Count() >= 5 {
			error_data(w, 403, map[string]interface{}{
				"error": "Team can only have a maximum of 5 members",
				"code":  "member_limit",
			})
			return
		}

		obj = members.NewObject(id)
		if obj.Id != id {
			error_out(w, "Object already exists", 409)
			return
		}
		obj.Ciphertext = ct
		err = obj.Save()
		if err != nil {
			error_out(w, "Object could not be saved", 500)
			return
		}

		parts := strings.Split(ct, " ")
		iv := parts[0]
		if iv != "new" {
			log_str, _ := obj.Log(iv)
			logs := model.TeamLogParse([]string{log_str})
			socket.TeamHub.Broadcast <- socket.JsonMessage(team.Id, logs[0])
		}

		res, _ = json.Marshal(obj)
	} else {
		objs, err := members.All()
		if err != nil {
			error_out(w, "Members could not be retrieved", 500)
			return
		}
		res, _ = json.Marshal(objs)
	}

	w.Write([]byte(string(res)))
}
