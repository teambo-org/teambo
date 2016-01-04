t = typeof t != 'undefined' ? t : {};
(function(){
    "use strict";

    var loaded = false,
        moved = false,
        target = "page",
        templates = {},
        debug = false;
    
    t.debug = function(){
        return debug;
    }
    
    t.linkify = function (text) {
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
    
    var extra_view_data = {
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
        theme: "dark",
        chat: {
            autoclose: true
        }
    }
    
    t.render = function(tplname, data) {
        data = data ? data : {};
        t.extend(data, extra_view_data);
        var html = Mustache.to_html(
            templates[tplname],
            data,
            templates
        );
        return html;
    };
    
    t.setTarget = function(id) {
        target = id;
    };

    var hashChange = function(hash, data){
        data = data ? data : {};
        var uri = new Uri(hash),
            path = uri.path().split('..')[0],
            data = t.extend(data, uri.getQueryParams()),
            route = t.router.find(path);
        if(route && route.tpl.indexOf('external') !== 0 && !t.id('dash-main')) {
            t.id('page').innerHTML = t.render("layout/dashboard", data);
            exec_body_scripts(t.id('page'));
            target = "dash-main";
        } else if (route && route.tpl.indexOf('external') === 0 && loaded && target != "page") {
            window.location.reload();
            return;
        }
        if(route) {
            t.extend(data, route.data);
            t.id(target).innerHTML = t.render(route.tpl, data);
            exec_body_scripts(t.id(target));
            if(loaded) {
                t.id(target).scrollTop = 0;
            }
            setTimeout(function(loaded){
                scrollToSub(hash, loaded);
            }, 0, loaded);
            if(loaded) {
                t.audio.play('click', 1);
            }
        }
    };

    t.gotoUrl = function(href, replace) {
        if(window.location.hash == "#!"+href) {
            t.refresh();
        } else if(replace) {
            hashChange(href);
        } else {
            window.location.hash = "#!"+href;
        }
    };
    
    t.refresh = function() {
        moved = true;
        hashChange(window.location.hash.substr(2));
    };
    
    t.replace = function(url, data) {
        hashChange(url, data);
    };
    
    var scrollToSub = function(hash, isLoaded) {
        var parts = hash.split('..');
        if(parts.length > 1 && t.id(parts[1])) {
            var el = t.id(parts[1]),
                add = t.id(target).offsetHeight - el.offsetHeight;
            el.classList.add('hi');
            t.id(target).parentNode.scrollTop = Math.max(add/4, 10);
        } else if (isLoaded){
            t.id(target).parentNode.scrollTop = 0;
        }
    };

    t.init = function(opts) {
        if(loaded) {
            return;
        }
        debug = opts.debug;
        templates = opts.templates;
        
        t.router.init(templates);
        t.extend(extra_view_data, {
            theme: t.themes[extra_view_data.theme],
        });
        
        t.acct.init();
        
        hashChange(window.location.hash.substr(2));
        
        t.id('init').remove();
        loaded = true;
        
        window.onhashchange = t.refresh;
        
        document.body.addEventListener('click', function(e) {
            if(e.target.nodeName == 'A' && (e.target.classList.contains('replace') 
            || e.target.parentNode.classList.contains('replace'))) {
                e.preventDefault();
                t.gotoUrl(e.target.getAttribute('href').substr(2), true);
            }
        });
        document.body.addEventListener('click', function(e) {
            if(e.target.nodeName == 'A' && (e.target.classList.contains('force') 
            || e.target.parentNode.classList.contains('force'))) {
                e.preventDefault();
                hashChange(e.target.getAttribute('href').substr(2));
            }
        });
        
        FastClick.attach(document.body);
        
        t.audio.loadAll(opts.audio);
    };
    
    t.extend = function(target, obj) {
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                target[i] = obj[i];
            }
        }
        return target;
    };
    
    t.clone = function(obj) {
        return t.extend({}, obj);
    };
    
    t.id = function(id) {
        return document.getElementById(id);
    }
    
    t.alert = function(msg) {
        delete window.alert;
        window.alert(msg);
    };
    
    window.applicationCache.addEventListener('updateready', function(e) {
        if (window.applicationCache.status == window.applicationCache.UPDATEREADY && !moved) {
            window.location.reload();
        }
    }, false);
    
    var exec_body_scripts = function(body_el) {
        function nodeName(elem, name) {
          return elem.nodeName && elem.nodeName.toUpperCase() === name.toUpperCase();
        };
        function evalScript(elem) {
            var data = (elem.text || elem.textContent || elem.innerHTML || "" ),
                head = document.getElementsByTagName("head")[0] || document.documentElement,
                script = document.createElement("script");
            script.type = "text/javascript";
            try {
                script.appendChild(document.createTextNode(data));      
            } catch(e) {
                script.text = data;
            }
            head.insertBefore(script, head.firstChild);
            head.removeChild(script);
        };
        var scripts = [],
            script,
            children_nodes = body_el.getElementsByTagName('script'),
            child,
            i;
        for (i = 0; children_nodes[i]; i++) {
            child = children_nodes[i];
            if (nodeName(child, "script" ) && (!child.type || child.type.toLowerCase() === "text/javascript")) {
                scripts.push(child);
            }
        }
        for (i = 0; scripts[i]; i++) {
            script = scripts[i];
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
            evalScript(scripts[i]);
        }
    };
    
})();
