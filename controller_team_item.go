package main

import (
	"encoding/json"
	"net/http"
	"errors"
)

func team_item_newId(team_id string, bucket_id string) (string) {
	id := randStr(8)

	exists, _ := team_item_exists(team_id, bucket_id, id)
	if exists {
		id = team_item_newId(team_id, bucket_id)
	}
	return id
}

func handle_team_item(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	
	team_id   := r.FormValue("team_id")
	bucket_id := r.FormValue("bucket_id")
	mkey      := r.FormValue("mkey")
	id        := r.FormValue("id")
	ct        := r.FormValue("ct")
	
	item := TeamItem{}
	err  := errors.New("")
	
	team, err := team_find(team_id)
	if err != nil {
		error_out(w, "Team could not be found", 500)
		return
	}
	if team.Id != team_id {
		error_out(w, "Team does not exist", 404)
		return
	}
	
	exists, err := team_member_exists(team_id, mkey)
	if err != nil || !exists {
		// failed authentication
		error_out(w, "Team member not found", 403)
		return
	}
	
	bucket, err := team_bucket_find(team_id, bucket_id)
	if err != nil {
		error_out(w, "Bucket could not be found", 500)
		return
	}
	if bucket.Id != bucket_id {
		error_out(w, "Bucket does not exist", 404)
		return
	}

	if r.Method == "POST" {
		if id == "" {
			id   = team_item_newId(team_id, bucket_id)
			item, err = team_item_save(team_id, bucket_id, id, "new")
			if err != nil {
				error_out(w, "Item could not be created", 500)
				return
			}
		} else if len(id) > 0 && len(ct) > 0 {
			item, err = team_item_find(team_id, bucket_id, id)
			if err != nil {
				error_out(w, "Item could not be found", 500)
				return
			}
			if item.Id != id {
				error_out(w, "Item does not exist", 404)
				return
			}
			item, err = team_item_save(team_id, bucket_id, id, ct)
			if err != nil {
				error_out(w, "Item could not be saved", 500)
				return
			}
		} else {
			error_out(w, "Invalid Request", 400)
			return
		}
	} else {
		item, err = team_item_find(team_id, bucket_id, id)
		if err != nil {
			error_out(w, "Item could not be found", 500)
			return
		}
		if item.Id != id {
			error_out(w, "Item does not exist", 404)
			return
		}
	}

	res, _ := json.Marshal(item)
	w.Write([]byte(string(res)))
}

func handle_team_item_remove(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	
	team_id   := r.FormValue("team_id")
	bucket_id := r.FormValue("bucket_id")
	mkey      := r.FormValue("mkey")
	item_id   := r.FormValue("item_id")
	
	item := TeamItem{}
	err  := errors.New("")
	
	team, err := team_find(team_id)
	if err != nil {
		error_out(w, "Team could not be found", 500)
		return
	}
	if team.Id != team_id {
		error_out(w, "Team does not exist", 404)
		return
	}
	
	exists, err := team_member_exists(team_id, mkey)
	if err != nil || !exists {
		// failed authentication
		error_out(w, "Team member not found", 403)
		return
	}
	
	bucket, err := team_bucket_find(team_id, bucket_id)
	if err != nil {
		error_out(w, "Bucket could not be found", 500)
		return
	}
	if bucket.Id != bucket_id {
		error_out(w, "Bucket does not exist", 404)
		return
	}

	if r.Method == "POST" {
		if len(item_id) > 0  {
			item, err = team_item_find(team_id, bucket_id, item_id)
			if err != nil {
				error_out(w, "Item could not be found", 500)
				return
			}
			if item.Id != item_id {
				error_out(w, "Item does not exist", 404)
				return
			}
			err = team_item_remove(team_id, bucket_id, item_id)
			if err != nil {
				error_out(w, "Item could not be removed", 500)
				return
			}

			w.WriteHeader(204)
            return
		} else {
			error_out(w, "Invalid Request", 400)
			return
		}
	} else {
		error_out(w, "Method not allowed.", 405)
		return
	}

	error_out(w, "Invalid Request", 400)
	return
}
