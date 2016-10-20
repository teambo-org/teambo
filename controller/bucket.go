package controller

import (
	"../model"
	"encoding/json"
	"errors"
	"net/http"
	// "log"
)

func Bucket(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	team_id := r.FormValue("team_id")
	mkey := r.FormValue("mkey")
	id := r.FormValue("id")
	ct := r.FormValue("ct")

	bucket := model.Bucket{}
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
	mkey := r.FormValue("mkey")

	buckets := []model.Bucket{}
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
	mkey := r.FormValue("mkey")
	bucket_id := r.FormValue("bucket_id")

	bucket := model.Bucket{}
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
