package main

import (
	"./controller"
	"net/http"
)

var routes = map[string]func(http.ResponseWriter, *http.Request){
	"/":                    controller.Index,
	"/acct":                controller.Acct,
	"/acct/auth":           controller.AcctAuth,
	"/acct/unlock":         controller.AcctUnlock,
	"/acct/verification":   controller.AcctVerification,
	"/acct/socket":         controller.AcctSocket,
	"/invite":              controller.Invite,
	"/invite/response":     controller.InviteResponse,
	"/invite/acceptance":   controller.InviteAcceptance,
	"/teams":               controller.Teams,
	"/team":                controller.Team,
	"/team/remove":         controller.TeamRemove,
	"/team/summary":        controller.TeamSummary,
	"/team/integrity":      controller.TeamIntegrity,
	"/team/socket":         controller.TeamSocket,
	"/team/members":        controller.Members,
	"/team/member":         controller.Member,
	"/team/member/remove":  controller.MemberRemove,
	"/team/member/access":  controller.MemberAccess,
	"/team/folders":        controller.HandleTeamObjects("folder", true),
	"/team/folder":         controller.HandleTeamObject("folder", true),
	"/team/folder/remove":  controller.HandleTeamObjectRemove("folder", true),
	"/team/items":          controller.HandleTeamObjects("item", true),
	"/team/item":           controller.HandleTeamObject("item", true),
	"/team/item/remove":    controller.HandleTeamObjectRemove("item", true),
	"/team/comments":       controller.HandleTeamObjects("comment", true),
	"/team/comment":        controller.HandleTeamObject("comment", true),
	"/team/comment/remove": controller.HandleTeamObjectRemove("comment", true),
	"/team/plans":          controller.HandleTeamObjects("plan", true),
	"/team/plan":           controller.HandleTeamObject("plan", true),
	"/team/plan/remove":    controller.HandleTeamObjectRemove("plan", true),
	"/team/wikis":          controller.HandleTeamObjects("wiki", true),
	"/team/wiki":           controller.HandleTeamObject("wiki", true),
	"/team/wiki/remove":    controller.HandleTeamObjectRemove("wiki", true),
	"/app.manifest":        controller.Manifest,
	"/app.manifestweb":     controller.WebManifest,
	"/init.js":             controller.Initjs,
	"/test":                controller.Test,
}
