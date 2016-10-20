package controller

import (
	"../model"
	"encoding/json"
	"net/http"
	// "log"
)

func Item(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	team_id := r.FormValue("team_id")
	id := r.FormValue("id")
	ct := r.FormValue("ct")

	_, err := auth_team(w, r)
	if err != nil {
		return
	}

	item := model.Item{}

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

	_, err := auth_team(w, r)
	if err != nil {
		return
	}

	items := []model.Item{}

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
	item_id := r.FormValue("item_id")

	_, err := auth_team(w, r)
	if err != nil {
		return
	}

	item := model.Item{}

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
