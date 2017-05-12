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
    if(typeof ready === 'boolean' && updateready != ready) {
      updateready = ready;
      t.view.updateStatus();
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

  t.online = function(status) {
    if(typeof status === 'boolean' && online != status) {
      online = status;
      t.view.updateStatus();
    }
    return online;
  };

  t.pageTarget = function() {
    return target;
  };

  t.reload = function() {
    t.view.render('page', 'external/blank');
    if(t.acct.current) {
      t.acct.current.cacheAuth();
      window.location.reload();
    } else {
      window.location.reload();
    }
  };

  var hashChange = function(hash, data) {
    var uri = new Uri(hash);
    var path = uri.path().split('..')[0];
    var route = t.router.findClosest(path);
    data = t.extend(data || {}, uri.getQueryParams());
    var silent = data.silent ? data.silent : false;
    if(updateready) {
      t.reload();
      return;
    }
    if(!route) {
      t.log('route not found ' + hash);
      t.gotoUrl('/login');
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
      t.socket.team.stop();
      t.view.unset('team');
      t.team.current = null;
    }
    var nav = function() {
      if(route.tpl.indexOf('external') !== 0 && !document.getElementById('main')) {
        if(!t.view.isset('team')) {
          t.gotoUrl('/account');
        }
        t.view.render('page', "layout/team", data);
        target = "main";
      } else if (route.tpl.indexOf('external') === 0 && loaded && target != "page") {
        target = "page";
      }
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
    };
    if(p.length) {
      Promise.all(p).then(nav);
    } else {
      nav();
    }
  };

  t.gotoUrl = function(href, replace, data) {
    if(window.location.hash == "#"+href) {
      t.refresh(data);
    } else if(replace) {
      hashChange(href, data);
    } else {
      window.location.hash = "#"+href;
    }
  };

  t.refresh = function(data) {
    moved = true;
    hashChange(window.location.hash.substr(1), data);
  };

  t.replace = function(url, data) {
    hashChange(url, data);
  };

  t.afterAuth = function(hash) {
    var val = after_auth;
    if(hash) {
      after_auth = hash;
    } else {
      after_auth = null;
    }
    return val ? val : '/account';
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
    t.device.init().then(function() {
      t.acct.init().then(function(){
        t.view.set('acct', t.acct.current);
        hashChange(window.location.hash.substr(1));
        window.onhashchange = t.refresh;
        t.audio.loadAll(opts.audio);
      }).catch(function(e) {
        t.trace(e);
        t.acct.deAuth();
        // TODO: Fix infinite reload on serious app error
        window.location.reload();
      });
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

  return t;

})(Teambo || {});
