Teambo.view = (function(t){
    "use strict";

    var templates   = {},
        template_js = {},
        obj = {
            linkify : function() {
                return function(text, render) {
                    return t.linkify(render(text));
                }
            },
            urle : function() {
                return function(text, render) {
                    return encodeURIComponent(render(text));
                };
            },
            markdown : function() {
                return function(text, render) {
                    return micromarkdown.parse(render(text));
                };
            },
            chat: {
                autoclose: true
            }
        };

    var linkify = function (text) {
        var r = ' ' +  text + ' ',
            domainRegEx = "([\\w]+\\.)+(com|org|net|gov|edu|mil|biz|cat|int|pro|tel|xxx|jobs|arpa|coop|asia|info|mobi|name|aero|jobs|museum|travel|[a-z]{2})",
            ipRegEx = "((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)",
            pathRegEx = "([\\/(&#x2F;)\\?\\#]+[^ \\\"\\t\\n\\r\\<\\{\\}]*)?",
            chr = "<span class=\"chr\">&#xa71b;</span>";
        r = r.replace(new RegExp("(^|\\n| )(mailto:)?([a-z0-9&\\-_\\.]+@"+domainRegEx+")([^\\w]{1})", "ig"),                                         "$1<a target=\"_blank\" rel=\"nofollow\" href=\"mailto:$3\">$3</a>"+chr+"$6");
        r = r.replace(new RegExp("(^|\\n| )((https?|ftp|irc):&#x2F;&#x2F;("+domainRegEx+"|"+ipRegEx+")(\\:[0-9]+)?"+pathRegEx+")([^\\w]{1})", "ig"), "$1<a target=\"_blank\" rel=\"nofollow\" href=\"$2\">$2</a>"+chr+"$1");
        r = r.replace(new RegExp("(^|\\n| )(("+domainRegEx+"|"+ipRegEx+")(\\:[0-9]+)?"+pathRegEx+")([^\\w]{1})", "ig"),                              "$1<a target=\"_blank\" rel=\"nofollow\" href=\"http:&#x2F;&#x2F;$2\">$2</a>"+chr+"$1");
        return r.slice(1,-1);
    };

    return {
        init: function(opts) {
            templates = opts.templates;
            template_js = opts.template_js;

            if(window.applicationCache.status !== 0) {
                window.applicationCache.addEventListener('updateready', function(e) {
                    if(window.applicationCache.status == window.applicationCache.UPDATEREADY) {
                        if(!t.moved()) {
                            window.location.reload();
                        } else {
                            t.updateReady(true);
                        }
                        t.online(true);
                    }
                }, false);
                window.applicationCache.addEventListener('noupdate', function(e) {
                    t.online(true);
                }, false);
                window.applicationCache.addEventListener('error', function(e) {
                    t.online(false);
                }, false);

                var startCacheCheck = function() {
                    if(!t.updateReady()) {
                        setTimeout(function(){
                            window.applicationCache.update();
                            startCacheCheck();
                        }, 30000);
                    }
                };

                window.applicationCache.update();
                startCacheCheck();
            }
        },
        render: function(tplname, data, override) {
            data = data ? data : {};
            override = override ? override : {};
            t.extend(data, obj);
            t.extend(data, override);
            var html = Mustache.to_html(
                templates[tplname],
                data,
                templates
            );
            return html;
        },
        isset: function(k) {
            return k in obj;
        },
        get: function(k) {
            return k in obj ? obj[k] : null;
        },
        set: function(k, v) {
            obj[k] = v;
        },
        unset: function(k, v) {
            delete obj[k];
        },
        obj: obj
    };

})(Teambo);
