package util

import (
	"io/ioutil"
	"log"
	"strings"
)

var Config config

type config struct {
	values map[string]string
}

func (c *config) Parse(path string) {
	file, err := ioutil.ReadFile(path)
	if err != nil {
		log.Panic("CONFIG ERROR - " + err.Error())
		return
	}
	lines := strings.Split(string(file), "\n")
	newConfig := map[string]string{}
	for _, line := range lines {
		fields := strings.Fields(line)
		if len(fields) > 1 {
			newConfig[fields[0]] = strings.Join(fields[1:], " ")
		}
	}
	c.values = newConfig
}

func (c *config) Get(key string) string {
	return c.values[key]
}

func (c *config) All() map[string]string {
	return c.values
}

func (c *config) Validate() bool {
	if c.values["secret"] == "" || c.values["secret"] == "EMPTY" {
		log.Println("You must provide a secret in your configuration file")
		log.Println("Here's a random secret you can use:\n\nsecret " + RandStr(80) + "\n")
		return false
	}
	if c.values["acct.verification_required"] != "false" &&
		c.values["smtp.user"] == "" || c.values["smtp.user"] == "__USER__" ||
		c.values["smtp.pass"] == "" || c.values["smtp.pass"] == "__PASS__" {
		log.Println("You must configure an Email Service Provider under smtp.* (__USER__ / __PASS__)")
		log.Println("Try a free account from mailtrap.io for dev or sendgrid.com for prod")
		return false
	}
	return true
}
