package socket

import (
	"encoding/json"
)

type wsmessage struct {
	channel_id string
	text       string
}

func Message(channel_id string, text string) wsmessage {
	return wsmessage{channel_id, channel_id + "-" + text}
}

func JsonMessage(channel_id string, data map[string]interface{}) wsmessage {
	data["channel_id"] = channel_id
	json_bytes, _ := json.Marshal(data)
	return wsmessage{channel_id, string(json_bytes)}
}

func JsonMessagePure(channel_id string, data map[string]interface{}) wsmessage {
	json_bytes, _ := json.Marshal(data)
	return wsmessage{channel_id, string(json_bytes)}
}
