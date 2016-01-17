package main

import (
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"github.com/boltdb/bolt"
	"io/ioutil"
	"log"
	"math/rand"
	"net/mail"
	"net/smtp"
	"strings"
	"time"
	"encoding/json"
	"net/http"
)

func parseConfig(path string) map[string]string {
	file, err := ioutil.ReadFile(path)
	if err != nil {
		log.Panic("CONFIG ERROR - " + err.Error())
		return map[string]string{}
	}
	lines := strings.Split(string(file), "\n")
	newConfig := map[string]string{}
	for _, line := range lines {
		fields := strings.Fields(line)
		if len(fields) > 1 {
			newConfig[fields[0]] = strings.Join(fields[1:], " ")
		}
	}
	return newConfig
}

func sendMail(recipient string, subject string, body string) error {
	auth := smtp.PlainAuth(
		"",
		config["smtp.user"],
		config["smtp.pass"],
		config["smtp.host"],
	)
	from := mail.Address{"Teambo", config["smtp.from"]}
	to := mail.Address{"User", recipient}
	header := make(map[string]string)
	header["From"] = from.String()
	header["To"] = to.String()
	header["Subject"] = subject
	header["MIME-Version"] = "1.0"
	header["Content-Type"] = "text/plain; charset=\"utf-8\""
	header["Content-Transfer-Encoding"] = "base64"

	message := ""
	for k, v := range header {
		message += fmt.Sprintf("%s: %s\r\n", k, v)
	}
	message += "\r\n" + base64.StdEncoding.EncodeToString([]byte(body))

	return smtp.SendMail(
		config["smtp.host"]+":"+config["smtp.port"],
		auth,
		from.Address,
		[]string{to.Address},
		[]byte(message),
	)
}

func randStr(strlen int) string {
	rand.Seed(time.Now().UTC().UnixNano())
	const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
	result := make([]byte, strlen)
	for i := 0; i < strlen; i++ {
		result[i] = chars[rand.Intn(len(chars))]
	}
	return string(result)
}

func randSha() string {
	sha := sha256.New()
	sha.Write([]byte(randStr(16)))
	return base64.StdEncoding.EncodeToString(sha.Sum(nil))
}

func db_update(fn func(*bolt.Tx) error) error {
	db, err := bolt.Open(config["app.data"]+"/global.db", 0644, nil)
	if err != nil {
		return err
	}
	defer db.Close()
	return db.Update(fn)
}

func db_view(fn func(*bolt.Tx) error) error {
	db, err := bolt.Open(config["app.data"]+"/global.db", 0644, nil)
	if err != nil {
		return err
	}
	defer db.Close()
	return db.View(fn)
}

func error_out(w http.ResponseWriter, msg string, status int) {
	res, _ := json.Marshal(map[string]string{
		"error": msg,
	})
	http.Error(w, string(res), status)
	return
}
