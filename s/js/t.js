var t = typeof t != 'undefined' ? t : {};
(function(){
    "use strict";

    var loaded = false,
        moved = false,
        manifest = false,
        updateready = false,
        target = "page",
        templates = {},
        template_js = {},
        debug = false,
        last_hash = '',
        salt = null,
        after_auth = null;
    
    t.debug = function(){
        return debug;
    };
    
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
    
    var view = {
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
    };
    
    t.render = function(tplname, data) {
        data = data ? data : {};
        t.extend(data, view);
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
        if(updateready) {
            window.location.reload();
        }
        if(route) {
            t.extend(data, route.data);
            var p = [];
            if('tid' in data && (!('team' in view) || view.team.id != data.tid)) {
                if(t.acct.isAuthed()) {
                    p.push(t.acct.team.find(data.tid).then(function(team){
                        view.team = team;
                    }));
                } else {
                    after_auth = hash;
                    t.gotoUrl('/login');
                    return;
                }
            }
            Promise.all(p).then(function(){
                if(route.tpl.indexOf('external') !== 0 && !t.id('dash-main')) {
                    t.id('page').innerHTML = t.render("layout/dashboard", data);
                    run_template_js(t.id('page'));
                    target = "dash-main";
                } else if (route.tpl.indexOf('external') === 0 && loaded && target != "page") {
                    delete view['team'];
                    target = "page";
                }
                var tar = t.id(target);
                tar.innerHTML = t.render(route.tpl, data);
                run_template_js(tar);
                if(tar.firstChild.classList.contains('require-auth') && !t.acct.isAuthed()) {
                    t.gotoUrl('/login');
                }
                if(tar.firstChild.classList.contains('require-no-auth') && t.acct.isAuthed()) {
                    t.gotoUrl('/account');
                }
                if(tar.firstChild.classList.contains('require-team') && !view.team) {
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
                loaded = true;
            }).catch(function(){
                t.gotoUrl("");
            });
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
    
    t.afterAuth = function() {
        var val = after_auth;
        after_auth = null;
        return val ? val : '/account';
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
        manifest = opts.manifest;
        templates   = opts.templates;
        template_js = opts.template_js;
        
        t.router.init(templates);
        t.extend(view, {
            theme: t.themes[view.theme],
            acct: t.acct
        });
        
        t.acct.init().then(function(){
            hashChange(window.location.hash.substr(1));
            
            window.onhashchange = t.refresh;
            
            var anchorClass = function(el, classname) {
                return (el.nodeName == 'A' && el.classList.contains(classname))
                  || (el.parentNode.nodeName == 'A' && el.parentNode.classList.contains(classname));
            };
            
            document.body.addEventListener('click', function(e) {
                if(anchorClass(e.target, 'replace')) {
                    e.preventDefault();
                    t.gotoUrl(e.target.getAttribute('href').substr(1), true);
                    return;
                }
                if(anchorClass(e.target, 'logout')) {
                    e.preventDefault();
                    t.acct.deAuth();
                    t.gotoUrl('/login');
                    return;
                }
                if(anchorClass(e.target, 'force')) {
                    e.preventDefault();
                    hashChange(e.target.getAttribute('href').substr(1));
                    return;
                }
            });
            
            FastClick.attach(document.body);
            
            t.audio.loadAll(opts.audio);
        }).catch(function() {
            t.acct.deAuth();
            window.location.reload();
        });
        
        if(manifest) {
            startCacheCheck();
        }
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
                t.trace(e);
            });
        }
        return p;
    };
    
    t.id = function(id) {
        return document.getElementById(id);
    };

    t.log = function(msg) {
        if('console' in window && t.debug()) {
            window.console.log(msg);
        }
    };
    
    t.trace = function(e) {
        if('console' in window && t.debug()) {
            window.console.trace(e);
        }
    };
    
    t.alert = function(msg) {
        delete window.alert;
        window.alert(msg);
    };
    
    t.salt = function() {
        if(salt) {
            return Promise.resolve(salt);
        } else {
            return t.promise(function(fulfill, reject) {
                localforage.getItem('salt').then(function(salt){
                    if(!salt) {
                        salt = t.crypto.randomKey();
                        localforage.setItem('salt', salt);
                    }
                    fulfill(salt);
                });
            });
        }
    };
    
    window.applicationCache.addEventListener('updateready', function(e) {
        if (window.applicationCache.status == window.applicationCache.UPDATEREADY && !moved) {
            window.location.reload();
        } else {
            updateready = true;
        }
    }, false);
    
    var startCacheCheck = function() {
        if(!updateready) {
            setTimeout(function(){
                window.applicationCache.update();
                startCacheCheck();
            }, 30000);
        }
    };
    
    var run_template_js = function(tar) {
        var els = tar.querySelectorAll('[data-tpljs]'),
            el;
        for(var i = 0; el = els[i]; i++) {
            var tplname = el.getAttribute('data-tpljs');
            if(tplname in template_js) {
                template_js[tplname]();
            }
        }
    };
    
    Array.prototype.findByProperty = function(k, v) {
        var self = this,
            ret = null;
        this.forEach(function(o) {
            if(typeof o === 'object' && o[k] === v) {
                ret = o;
            }
        });
        return ret;
    };
    Array.prototype.deleteByProperty = function(k, v) {
        var self = this;
        this.forEach(function(o, i) {
            if(typeof o === 'object' && o[k] === v) {
                self.splice(i, 1);
            }
        });
        return this;
    };
    
})();
