var Teambo = (function(t){
    "use strict";

    var loaded      = false,
        moved       = false,
        manifest    = false,
        updateready = false,
        online      = false,
        target      = "page",
        debug       = false,
        last_hash   = '',
        after_auth  = null,
        template_js = {};
    
    t.salt = null;
    
    t.debug = function(){
        return debug;
    };
    
    t.setTarget = function(id) {
        target = id;
    };

    var hashChange = function(hash, data){
        var uri = new Uri(hash),
            path = uri.path().split('..')[0],
            route = t.router.find(path);
        data = t.extend(data || {}, uri.getQueryParams());
        if(updateready) {
            window.location.reload();
        }
        if(route) {
            t.extend(data, route.data);
            var p = [];
            if('team_id' in data && (!(t.view.isset('team')) || t.view.get('team').id != data.team_id)) {
                if(t.acct.isAuthed()) {
                    p.push(t.team.init(data.team_id).then(function(team){
                        t.view.set('team', team);
                    }));
                } else {
                    after_auth = hash;
                    t.gotoUrl('/login');
                    return;
                }
            }
            Promise.all(p).then(function(){
                if(t.view.isset('team')) {
                    if('bucket_id' in data && data.bucket_id in t.view.get('team').buckets) {
                        data.bucket = t.view.get('team').buckets[data.bucket_id];
                    }
                }
                if(route.tpl.indexOf('external') !== 0 && !t.id('dash-main')) {
                    if(!t.view.isset('team')) {
                        t.gotoUrl('/account');
                    }
                    t.id('page').innerHTML = t.view.render("layout/dashboard", data, true);
                    run_template_js(t.id('page'));
                    target = "dash-main";
                } else if (route.tpl.indexOf('external') === 0 && loaded && target != "page") {
                    t.view.unset('team');
                    target = "page";
                }
                var tar = t.id(target);
                tar.innerHTML = t.view.render(route.tpl, data);
                if(target === 'page') {
                    t.id('page').innerHTML = t.id('page').innerHTML + '<canvas id="bgcanvas"></canvas>';
                }
                run_template_js(tar);
                if(tar.firstChild.classList.contains('require-auth') && !t.acct.isAuthed()) {
                    t.gotoUrl('/login');
                }
                if(tar.firstChild.classList.contains('require-no-auth') && t.acct.isAuthed()) {
                    t.gotoUrl('/account');
                }
                if(tar.firstChild.classList.contains('require-team') && !t.view.isset('team')) {
                    t.gotoUrl('/account');
                }
                if(tar.firstChild.classList.contains('require-bucket') && t.view.get('team').buckets.indexOf(data.bucket_id) < 0) {
                    t.gotoUrl('/dashboard');
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
            }).catch(function(e){
                t.trace(e);
                t.gotoUrl("");
            });
        } else {
            t.log('route not found ' + hash);
        }
    };

    t.gotoUrl = function(href, replace) {
        if(window.location.hash == "#"+href) {
            refresh();
        } else if(replace) {
            hashChange(href);
        } else {
            window.location.hash = "#"+href;
        }
    };
    
    var refresh = function() {
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
        manifest = opts.manifest;
        
        template_js = opts.template_js;
        t.view.init(opts);
        
        t.router.init(opts.templates);

        var anchorClass = function(el, classname) {
            return (el.nodeName == 'A' && el.classList.contains(classname)) || 
                (el.parentNode.nodeName == 'A' && el.parentNode.classList.contains(classname));
        };
        
        Promise.all([
            t.getSalt(),
            t.acct.init()
        ]).then(function(){
            t.view.set('acct', t.acct.current);
            
            hashChange(window.location.hash.substr(1));
            
            window.onhashchange = refresh;
            
            document.body.addEventListener('mousedown', function(e) {
                if(e.target.nodeName == 'A') {
                    e.target.click();
                }
                if(e.target.parentNode.nodeName == 'A') {
                    e.target.parentNode.click();
                }
            });
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
    
        window.applicationCache.addEventListener('updateready', function(e) {
            if(window.applicationCache.status == window.applicationCache.UPDATEREADY) {
                if(!moved) {
                    window.location.reload(); 
                } else {
                    updateready = true;
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
            if(typeof msg == 'object' && 'then' in msg) {
                msg.then(t.log);
            } else {
                window.console.log(msg);
            }
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
    
    t.online = function(status) {
        if(typeof status === 'boolean' && online != status) {
            online = status;
            t.updateStatus();
        }
        return online;
    };
    
    t.afterAuth = function() {
        var val = after_auth;
        after_auth = null;
        return val ? val : '/account';
    };
    
    t.updateStatus = function() {
        var status = t.id('status');
        if (status) {
            status.className = online ? 'online' : 'offline';
            status.innerHTML = online ? 'online' : 'offline';
        }
    };
    
    t.getSalt = function() {
        if(t.salt) {
            return Promise.resolve(t.salt);
        } else {
            return t.promise(function(fulfill, reject) {
                localforage.getItem('salt').then(function(salt){
                    if(!salt) {
                        salt = t.crypto.randomKey();
                        localforage.setItem('salt', salt);
                    }
                    t.salt = salt;
                    fulfill(salt);
                });
            });
        }
    };
    
    var startCacheCheck = function() {
        if(!updateready) {
            setTimeout(function(){
                window.applicationCache.update();
                startCacheCheck();
            }, 30000);
        }
    };
    
    var run_template_js = function(tar) {
        var els = tar.querySelectorAll('[data-tpljs]');
        for(var i = 0; els[i]; i++) {
            var el = els[i],
                tplname = el.getAttribute('data-tpljs');
            if(tplname in template_js) {
                template_js[tplname]();
            }
        }
    };
    
    t.findByProperty = function(a, k, v) {
        var ret = null;
        a.forEach(function(o) {
            if(typeof o === 'object' && o[k] === v) {
                ret = o;
            }
        });
        return ret;
    };

    t.deleteByProperty = function(a, k, v) {
        a.forEach(function(o, i) {
            if(typeof o === 'object' && o[k] === v) {
                a.splice(i, 1);
            }
        });
        return a;
    };
    
    return t;
    
})(Teambo || {});


function draw_squares(ctx, t, r, b, l) {
    ctx.lineWidth = 1;
    ctx.beginPath();
    var stroke = function(o) {
        ctx.moveTo(l - o, t - o);
        ctx.lineTo(r + o, t - o);
        ctx.lineTo(r + o, b + o);
        ctx.lineTo(l - o, b + o);
        ctx.lineTo(l - o, t - o);
    };
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    stroke(2);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    stroke(4);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = "rgba(0,0,0,0.1)";
    stroke(6);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = "rgba(0,0,0,0.05)";
    stroke(8);
    ctx.closePath();
    ctx.stroke();
}

document.addEventListener("keydown", function(e) {
    if(e.keyIdentifier == "Down" || e.keyIdentifier == "Right") {
        var targets = document.querySelectorAll('a[href], input, button, select, textarea');
        console.log(targets);
        for(var i in targets) { 
            if(targets[i] === e.target) {
                i = parseInt(i);
                var new_i = i+1 < targets.length ? i+1 : 0;
                targets[new_i].focus();
                return;
            } 
        }
        targets[0].focus();
    } else if (e.keyIdentifier == "Up" || e.keyIdentifier == "Left") {
        var targets = document.querySelectorAll('a[href], input, button, select, textarea');
        for(var i in targets) { 
            if(targets[i] === e.target) {
                i = parseInt(i);
                var new_i = i-1 >= 0 ? i-1 : targets.length - 1;
                targets[new_i].focus();
                return;
            } 
        }
        targets[0].focus();
    }
}, false);

document.body.addEventListener('focusin', function(e) {
    var a = e.target.getBoundingClientRect(),
        canvas = Teambo.id('bgcanvas');
    if(canvas && a) {
        var ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        var t = Math.round(a.top)    + 0.5,
            r = Math.round(a.right)  - 0.5,
            b = Math.round(a.bottom) - 0.5,
            l = Math.round(a.left)   + 0.5;
        draw_squares(ctx, t, r, b, l);
    }
});
document.body.addEventListener('focusout', function(e) {
    var a = e.target.getBoundingClientRect(),
        canvas = Teambo.id('bgcanvas');
    if(canvas && a) {
        var ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
});
