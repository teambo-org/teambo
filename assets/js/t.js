var Teambo = (function(t){
  "use strict";

  var loaded      = false;
  var moved       = false;
  var updateready = false;
  var online      = false;
  var target      = "page";
  var debug       = false;
  var last_hash   = '';
  var after_auth  = null;
  var testing     = false;
  var editing     = false;
  var nav_queue   = [];

  t.salt = null;

  t.debug = function(){
    return debug;
  };

  t.testing = function(){
    return testing;
  };

  t.loaded = function(){
    return loaded;
  };

  t.updateReady = function(ready) {
    if(typeof ready === 'boolean') {
      updateready = ready;
    }
    return updateready;
  };

  t.moved = function() {
    return moved;
  };

  t.editing = function(v) {
    if(typeof v === 'boolean') {
      editing = v;
    }
    return editing;
  };

  t.reload = function() {
    t.view.render('page', 'external/blank');
    if(t.acct.current) {
      t.acct.current.cacheAuth();
    }
    window.location.reload();
  };

  var hashChange = function(hash, data){
    var uri = new Uri(hash);
    var path = uri.path().split('..')[0];
    var route = t.router.find(path);
    data = t.extend(data || {}, uri.getQueryParams());
    var silent = data.silent ? data.silent : false;
    if(updateready) {
      t.reload();
      return;
    }
    if(!route) {
      t.log('route not found ' + hash);
      return;
    }
    t.extend(data, route.data);
    var p = [];
    if('team_id' in data && (!(t.view.isset('team')) || t.view.get('team').id != data.team_id)) {
      if(t.acct.isAuthed()) {
        var logo = document.getElementById('logo');
        if(logo) {
          logo.classList.add('spinner');
        }
        p.push(t.team.init(data.team_id).then(function(team){
          t.view.set('team', team);
        }).catch(function(){
          t.gotoUrl('/account');
        }));
      } else {
        after_auth = hash;
        t.gotoUrl('/login');
        return;
      }
    } else if(!('team_id' in data)) {
      t.socket.stop();
      // t.event.off();
      t.view.unset('team');
      t.team.current = null;
    }
    Promise.all(p).then(function(){
      if(route.tpl.indexOf('external') !== 0 && !document.getElementById('main')) {
        if(!t.view.isset('team')) {
          t.gotoUrl('/account');
        }
        t.view.render('page', "team/layout", data);
        target = "main";
      } else if (route.tpl.indexOf('external') === 0 && loaded && target != "page") {
        target = "page";
      }
      nav_queue.forEach(function(fn) {
        fn();
      });
      nav_queue = [];
      editing = false;
      t.event.emit('pre-nav', route);
      t.view.render(target, route.tpl, data);
      scrollToSub(hash, loaded);
      if(loaded && !silent) {
        t.audio.play('click', 1);
      }
      t.event.emit('nav', route);
      last_hash = hash;
      loaded = true;
    });
  };

  t.gotoUrl = function(href, replace, data) {
    if(window.location.hash == "#"+href) {
      refresh(data);
    } else if(replace) {
      hashChange(href, data);
    } else {
      window.location.hash = "#"+href;
    }
  };

  var refresh = function(data) {
    moved = true;
    hashChange(window.location.hash.substr(1), data);
  };

  t.refresh = refresh;

  t.replace = function(url, data) {
    hashChange(url, data);
  };

  var scrollToSub = function(hash, isLoaded) {
    var parts = hash.split('..'),
      el = document.getElementById(parts[1]),
      tar = document.getElementById(target);
    if(parts.length > 1 && el) {
      var add = tar.offsetHeight - el.offsetHeight;
      el.classList.add('hi');
      tar.parentNode.scrollTop = Math.max(add/4, 10);
    } else if (isLoaded){
      tar.parentNode.scrollTop = 0;
    }
  };

  t.init = function(opts) {
    if(loaded) {
      return;
    }
    debug = opts.debug;
    testing = opts.testing;
    t.view.init(opts);
    t.router.init(opts.templates);
    Promise.all([
      t.getSalt(),
      t.acct.init()
    ]).then(function(){
      t.view.set('acct', t.acct.current);
      hashChange(window.location.hash.substr(1));
      window.onhashchange = refresh;
      t.audio.loadAll(opts.audio);
    }).catch(function() {
      t.acct.deAuth();
      window.location.reload();
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
    p.always = function(fn) {
      return p.then(fn).catch(fn);
    }
    if(t.debug()) {
      p.catch(function(e){
        t.trace(e);
      });
    }
    return p;
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
    if(typeof status === 'boolean') {
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
    var el = document.getElementById('status');
    if (el) {
      el.className = online ? 'online' : 'offline';
      el.innerHTML = online ? (updateready ? 'update ready' : 'online') : 'offline';
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

  t.nextNav = function(fn) {
    nav_queue.push(fn);
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

  t.array = {
    remove : function(a, v) {
      for(var i = a.length - 1; i >= 0; i--) {
        if(a[i] === v) {
           a.splice(i, 1);
        }
      }
      return a;
    }
  };

  t.isChild = function(parent, child) {
    if(child == null) {
      return false;
    }
    var p = document.getElementById(parent);
    var node = child.parentNode;
    while (node != null) {
      if (node == p) {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  };

  t.findParent = function(el, selector) {
    var parent;
    while(parent = el.parentNode) {
      if(!parent.matches) {
        return;
      }
      if(parent.matches(selector)) {
        return parent;
      }
      el = parent;
    }
  };

  t.matchParent = function(el, selector) {
    return el.matches(selector) ? el : t.findParent(el, selector);
  };

  return t;

})(Teambo || {});
