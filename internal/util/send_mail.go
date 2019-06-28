package util

import (
	"encoding/base64"
	"fmt"
	"net/mail"
	"net/smtp"
)

func SendMail(recipient string, subject string, body string) error {
	auth := smtp.PlainAuth(
		"",
		Config.Get("smtp.user"),
		Config.Get("smtp.pass"),
		Config.Get("smtp.host"),
	)
	from := mail.Address{"Teambo", Config.Get("smtp.from")}
	to := mail.Address{"User", recipient}
	header := make(map[string]string)
	header["From"] = from.String()
	header["To"] = to.String()
	header["Subject"] = subject
	header["MIME-Version"] = "1.0"
	header["Content-Type"] = "text/html; charset=\"utf-8\""
	header["Content-Transfer-Encoding"] = "base64"

	message := ""
	for k, v := range header {
		message += fmt.Sprintf("%s: %s\r\n", k, v)
	}
	message += "\r\n" + base64.StdEncoding.EncodeToString([]byte(body))

	return smtp.SendMail(
		Config.Get("smtp.host")+":"+Config.Get("smtp.port"),
		auth,
		from.Address,
		[]string{to.Address},
		[]byte(message),
	)
}
