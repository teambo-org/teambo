package controller

import (
	"../model"
	"encoding/json"
	"net/http"
	// "log"
)

func Items(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	team_id := r.FormValue("team_id")
	item_id := r.FormValue("item_id")

	_, err := auth_team(w, r)
	if err != nil {
		return
	}

	res := []byte{}

	if r.Method == "POST" {
		item := model.Item{}

		if item_id == "" {
			item = model.NewItem(team_id)
			err = item.Save(team_id)
			if err != nil {
				error_out(w, "Item could not be created", 500)
				return
			}
		} else if len(item_id) > 0 {
			item, err = model.FindItem(team_id, item_id)
			if err != nil {
				error_out(w, "Database error", 500)
				return
			}
			if item.Id == item_id {
				error_out(w, "Item already exists", 409)
				return
			}
			item.Id = item_id
			item.Ciphertext = "new"
			err = item.Save(team_id)
			if err != nil {
				error_out(w, "Item could not be saved", 500)
				return
			}
		}

		res, _ = json.Marshal(item)
	} else {
		items, err := model.AllItems(team_id)

		if err != nil {
			error_out(w, "Bucket could not be found", 500)
			return
		}

		res, _ = json.Marshal(items)
	}

	w.Write([]byte(string(res)))
}
