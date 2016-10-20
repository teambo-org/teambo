package controller

import (
	"../model"
	"encoding/json"
	"errors"
	"net/http"
	// "log"
)

func Item(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	team_id := r.FormValue("team_id")
	mkey := r.FormValue("mkey")
	id := r.FormValue("id")
	ct := r.FormValue("ct")

	item := model.Item{}
	err := errors.New("")

	team, err := model.FindTeam(team_id)
	if err != nil {
		error_out(w, "Team could not be found", 500)
		return
	}
	if team.Id != team_id {
		error_out(w, "Team does not exist", 404)
		return
	}

	exists, err := model.MemberExists(team_id, mkey)
	if err != nil || !exists {
		// failed authentication
		error_out(w, "Team member not found", 403)
		return
	}

	if r.Method == "POST" {
		if id == "" {
			item = model.NewItem(team_id)
			err = item.Save(team_id)
			if err != nil {
				error_out(w, "Item could not be created", 500)
				return
			}
		} else if len(id) > 0 && len(ct) > 0 {
			item, err = model.FindItem(team_id, id)
			if err != nil {
				error_out(w, "Item could not be found", 500)
				return
			}
			if item.Id != id {
				error_out(w, "Item does not exist", 404)
				return
			}
			item.Ciphertext = ct
			err = item.Save(team_id)
			if err != nil {
				error_out(w, "Item could not be saved", 500)
				return
			}
		} else {
			error_out(w, "Invalid Request", 400)
			return
		}
	} else {
		item, err = model.FindItem(team_id, id)
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

func ItemAll(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	team_id := r.FormValue("team_id")
	mkey := r.FormValue("mkey")

	items := []model.Item{}
	err := errors.New("")

	team, err := model.FindTeam(team_id)
	if err != nil {
		error_out(w, "Team could not be found", 500)
		return
	}
	if team.Id != team_id {
		error_out(w, "Team does not exist", 404)
		return
	}

	exists, err := model.MemberExists(team_id, mkey)
	if err != nil || !exists {
		error_out(w, "Team member not found", 403)
		return
	}

	if r.Method == "POST" {
		error_out(w, "Method not allowed", 405)
		return
	} else {
		items, err = model.AllItems(team_id)
		if err != nil {
			error_out(w, "Bucket could not be found", 500)
			return
		}
	}

	res, _ := json.Marshal(items)
	w.Write([]byte(string(res)))
}

func ItemRemove(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	team_id := r.FormValue("team_id")
	mkey := r.FormValue("mkey")
	item_id := r.FormValue("item_id")

	item := model.Item{}
	err := errors.New("")

	team, err := model.FindTeam(team_id)
	if err != nil {
		error_out(w, "Team could not be found", 500)
		return
	}
	if team.Id != team_id {
		error_out(w, "Team does not exist", 404)
		return
	}

	exists, err := model.MemberExists(team_id, mkey)
	if err != nil || !exists {
		// failed authentication
		error_out(w, "Team member not found", 403)
		return
	}

	if r.Method == "POST" {
		if len(item_id) > 0 {
			item, err = model.FindItem(team_id, item_id)
			if err != nil {
				error_out(w, "Item could not be found", 500)
				return
			}
			if item.Id != item_id {
				error_out(w, "Item does not exist", 404)
				return
			}
			err = item.Remove(team_id)
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