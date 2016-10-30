package controller

import (
	"../model"
	"encoding/json"
	"net/http"
	"strings"
	// "log"
)

func HandleTeamObject(bucket_name string) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		TeamObject(bucket_name, w, r)
	}
}

func TeamObject(bucket_name string, w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	team_id := r.FormValue("team_id")
	id := r.FormValue("id")
	ct := r.FormValue("ct")
	iv := r.FormValue("iv")

	_, err := auth_team(w, r)
	if err != nil {
		return
	}

	bucket := model.TeamBucket{bucket_name}
	obj := model.TeamObject{}

	if r.Method == "POST" {
		if len(id) > 0 && len(ct) > 0 {
			obj, err = bucket.Find(team_id, id)
			if err != nil {
				error_out(w, strings.Title(bucket_name)+" could not be found", 500)
				return
			}
			if obj.Id != id {
				error_out(w, strings.Title(bucket_name)+" does not exist", 404)
				return
			}
			if !strings.HasPrefix(obj.Ciphertext, iv) {
				error_out(w, "Team version does not match", 409)
				return
			}
			obj.Ciphertext = ct
			err = obj.Save(team_id)
			if err != nil {
				error_out(w, strings.Title(bucket_name)+" could not be saved", 500)
				return
			}

			parts := strings.Split(ct, " ")
			new_iv := parts[0]
			if new_iv != "new" {
				log, _ := obj.Log(team_id, new_iv)
				SocketHub.broadcast <- wsmessage{team_id, log}
			}

		} else {
			error_out(w, "Invalid Request", 400)
			return
		}
	} else {
		obj, err = bucket.Find(team_id, id)
		if err != nil {
			error_out(w, strings.Title(bucket_name)+" could not be found", 500)
			return
		}
		if obj.Id != id {
			error_out(w, strings.Title(bucket_name)+" does not exist", 404)
			return
		}
	}

	res, _ := json.Marshal(obj)
	w.Write([]byte(string(res)))
}

func HandleTeamObjectRemove(bucket_name string) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		TeamObjectRemove(bucket_name, w, r)
	}
}

func TeamObjectRemove(bucket_name string, w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	team_id := r.FormValue("team_id")
	id := r.FormValue("id")

	_, err := auth_team(w, r)
	if err != nil {
		return
	}

	bucket := model.TeamBucket{bucket_name}

	if r.Method == "POST" {
		if len(id) > 0 {
			obj, err := bucket.Find(team_id, id)
			if err != nil {
				error_out(w, strings.Title(bucket_name)+" could not be found", 500)
				return
			}
			if obj.Id != id {
				error_out(w, strings.Title(bucket_name)+" does not exist", 404)
				return
			}
			err = obj.Remove(team_id)
			if err != nil {
				error_out(w, strings.Title(bucket_name)+" could not be removed", 500)
				return
			}

			log, _ := obj.Log(team_id, "removed")
			SocketHub.broadcast <- wsmessage{team_id, log}
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

func HandleTeamObjects(bucket_name string) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		TeamObjects(bucket_name, w, r)
	}
}

func TeamObjects(bucket_name string, w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	team_id := r.FormValue("team_id")
	id := r.FormValue("id")

	_, err := auth_team(w, r)
	if err != nil {
		return
	}

	bucket := model.TeamBucket{bucket_name}

	res := []byte{}

	if r.Method == "POST" {
		obj := model.TeamObject{}

		if id == "" {
			obj = bucket.NewObject(team_id)
			err = obj.Save(team_id)
			if err != nil {
				error_out(w, "Bucket could not be created", 500)
				return
			}
		} else {
			obj, err = bucket.Find(team_id, id)
			if err != nil {
				error_out(w, "Database error", 500)
				return
			}
			if obj.Id == id {
				error_out(w, "Bucket already exists", 409)
				return
			}
			obj.Id = id
			obj.Ciphertext = "new"
			err = obj.Save(team_id)
			if err != nil {
				error_out(w, "Bucket could not be saved", 500)
				return
			}
		}

		res, _ = json.Marshal(obj)
	} else {
		objs, err := bucket.All(team_id)

		if err != nil {
			error_out(w, "Bucket could not be found", 500)
			return
		}

		res, _ = json.Marshal(objs)
	}

	w.Write([]byte(string(res)))
}
