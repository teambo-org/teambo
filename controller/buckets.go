package controller

import (
	"../model"
	"encoding/json"
	"net/http"
	// "log"
)

func Buckets(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	team_id := r.FormValue("team_id")
	bucket_id := r.FormValue("bucket_id")

	_, err := auth_team(w, r)
	if err != nil {
		return
	}

	res := []byte{}

	if r.Method == "POST" {
		bucket := model.Bucket{}

		if bucket_id == "" {
			bucket = model.NewBucket(team_id)
			err = bucket.Save(team_id)
			if err != nil {
				error_out(w, "Bucket could not be created", 500)
				return
			}
		} else if len(bucket_id) > 0 {
			bucket, err = model.FindBucket(team_id, bucket_id)
			if err != nil {
				error_out(w, "Database error", 500)
				return
			}
			if bucket.Id == bucket_id {
				error_out(w, "Bucket already exists", 409)
				return
			}
			bucket.Id = bucket_id
			bucket.Ciphertext = "new"
			err = bucket.Save(team_id)
			if err != nil {
				error_out(w, "Bucket could not be saved", 500)
				return
			}
		}

		res, _ = json.Marshal(bucket)
	} else {
		buckets, err := model.AllBuckets(team_id)

		if err != nil {
			error_out(w, "Bucket could not be found", 500)
			return
		}

		res, _ = json.Marshal(buckets)
	}

	w.Write([]byte(string(res)))
}
