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
