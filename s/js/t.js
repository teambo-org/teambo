t = typeof t != 'undefined' ? t : {};
(function(){
    "use strict";

    var loaded = false,
        moved = false,
        target = "page",
        templates = {},
        template_js = {},
        debug = false,
        last_hash = '';
    
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
            target = "page";
        }
        if(route) {
            var tar = t.id(target);
            t.extend(data, route.data);
            tar.innerHTML = t.render(route.tpl, data);
            run_template_js(tar);
            if(tar.firstChild.classList.contains('require-auth') && !t.acct.isAuthed()) {
                t.gotoUrl('/login');
            }
            if(tar.firstChild.classList.contains('require-no-auth') && t.acct.isAuthed()) {
                t.gotoUrl('/account');
            }
            
            if(loaded) {
                t.id(target).scrollTop = 0;
            }
            setTimeout(function(loaded){
                scrollToSub(hash, loaded);
            }, 0, loaded);
            if(loaded) {
                t.audio.play('click', 1);
            }
            last_hash = hash;
        } else {
            t.log('route not found ' + hash);
        }
    };

    t.gotoUrl = function(href, replace) {
        if(window.location.hash == "#"+href) {
            t.refresh();
        } else if(replace) {
            hashChange(href);
        } else {
            window.location.hash = "#"+href;
        }
    };
    
    t.refresh = function() {
        moved = true;
        hashChange(window.location.hash.substr(1));
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
        templates   = opts.templates;
        template_js = opts.template_js;
        
        t.router.init(templates);
        t.extend(extra_view_data, {
            theme: t.themes[extra_view_data.theme],
            acct: t.acct
        });
        
        t.acct.init().then(function(){
            hashChange(window.location.hash.substr(1));
            loaded = true;
            
            window.onhashchange = t.refresh;
            
            document.body.addEventListener('click', function(e) {
                if((e.target.nodeName == 'A' && e.target.classList.contains('replace'))
                || (e.target.nodeName == 'I' && e.target.parentNode.classList.contains('replace'))) {
                    e.preventDefault();
                    t.gotoUrl(e.target.getAttribute('href').substr(1), true);
                    return;
                } 
                if((e.target.nodeName == 'A' && e.target.classList.contains('logout'))
                || (e.target.nodeName == 'I' && e.target.parentNode.classList.contains('logout'))) {
                    e.preventDefault();
                    t.acct.deAuth();
                    t.gotoUrl('/login');
                    return;
                }
                if((e.target.nodeName == 'A' && e.target.classList.contains('force'))
                || (e.target.nodeName == 'I' && e.target.parentNode.classList.contains('force'))) {
                    e.preventDefault();
                    hashChange(e.target.getAttribute('href').substr(1));
                    return;
                }
            });
            
            FastClick.attach(document.body);
            
            t.audio.loadAll(opts.audio);
        });
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
    
    t.promise = function(f) {
        var p = new Promise(f);
        if(t.debug()) {
            p.catch(function(e){
                console.log(e);
                console.trace(e);
            });
        }
        return p;
    };
    
    t.id = function(id) {
        return document.getElementById(id);
    }

    t.log = function(msg) {
        if('console' in window && t.debug()) {
            window.console.log(msg);
        }
    };
    
    t.alert = function(msg) {
        delete window.alert;
        window.alert(msg);
    };
    
    window.applicationCache.addEventListener('updateready', function(e) {
        if (window.applicationCache.status == window.applicationCache.UPDATEREADY && !moved) {
            window.location.reload();
        }
    }, false);
    
    var run_template_js = function(tar) {
        var els = tar.querySelectorAll('[data-tpljs]'),
            el;
        for(var i = 0; el = els[i]; i++) {
            var tplname = el.getAttribute('data-tpljs');
            if(tplname in template_js) {
                template_js[tplname]();
            }
        }
    }
    
})();
