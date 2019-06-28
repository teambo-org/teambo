package asset

var jslib_test = append(jslib, []string{
	"/js/lib/jasmine.2.5.js",
	"/js/lib/jasmine-html.2.5.js",
}...)

var jsapp_test = append(jsapp, []string{
	"/js/test/boot.js",
	"/js/test/array.test.js",
	"/js/test/object.test.js",
	"/js/test/schema.test.js",
	"/js/test/acct.test.js",
	"/js/test/team.test.js",
	"/js/test/folder.test.js",
	"/js/test/item.test.js",
	"/js/test/plan.test.js",
	"/js/test/stress.test.js",
}...)

var cssapp_test = append(cssapp, []string{
	"/css/lib/jasmine.2.5.css",
}...)
