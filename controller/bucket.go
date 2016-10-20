package controller

import (
	"../model"
	"encoding/json"
	"net/http"
	// "log"
)

func Bucket(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	team_id := r.FormValue("team_id")
	id := r.FormValue("id")
	ct := r.FormValue("ct")

	bucket := model.Bucket{}

	_, err := auth_team(w, r)
	if err != nil {
		return
	}

	if r.Method == "POST" {
		if id == "" {
			bucket = model.NewBucket(team_id)
			err = bucket.Save(team_id)
			if err != nil {
				error_out(w, "Bucket could not be created", 500)
				return
			}
		} else if len(id) > 0 && len(ct) > 0 {
			bucket, err = model.FindBucket(team_id, id)
			if err != nil {
				error_out(w, "Bucket could not be found", 500)
				return
			}
			if bucket.Id != id {
				error_out(w, "Bucket does not exist", 404)
				return
			}
			bucket.Ciphertext = ct
			err = bucket.Save(team_id)
			if err != nil {
				error_out(w, "Bucket could not be saved", 500)
				return
			}
		} else {
			error_out(w, "Invalid Request", 400)
			return
		}
	} else {
		bucket, err = model.FindBucket(team_id, id)
		if err != nil {
			error_out(w, "Bucket could not be found", 500)
			return
		}
		if bucket.Id != id {
			error_out(w, "Bucket does not exist", 404)
			return
		}
	}

	res, _ := json.Marshal(bucket)
	w.Write([]byte(string(res)))
}

func BucketAll(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	team_id := r.FormValue("team_id")

	buckets := []model.Bucket{}

	_, err := auth_team(w, r)
	if err != nil {
		return
	}

	if r.Method == "POST" {
		error_out(w, "Method not allowed", 405)
		return
	} else {
		buckets, err = model.AllBuckets(team_id)
		if err != nil {
			error_out(w, "Bucket could not be found", 500)
			return
		}
	}

	res, _ := json.Marshal(buckets)
	w.Write([]byte(string(res)))
}

func BucketRemove(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	team_id := r.FormValue("team_id")
	bucket_id := r.FormValue("bucket_id")

	bucket := model.Bucket{}

	_, err := auth_team(w, r)
	if err != nil {
		return
	}

	if r.Method == "POST" {
		if len(bucket_id) > 0 {
			bucket, err = model.FindBucket(team_id, bucket_id)
			if err != nil {
				error_out(w, "Bucket could not be found", 500)
				return
			}
			if bucket.Id != bucket_id {
				error_out(w, "Bucket does not exist", 404)
				return
			}
			err = bucket.Remove(team_id)
			if err != nil {
				error_out(w, "Bucket could not be removed", 500)
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
