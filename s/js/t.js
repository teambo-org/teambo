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
  var template_js = {};
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

  var hashChange = function(hash, data){
    var uri = new Uri(hash);
    var path = uri.path().split('..')[0];
    var route = t.router.find(path);
    data = t.extend(data || {}, uri.getQueryParams());
    if(updateready) {
      if(t.acct.current) {
        t.acct.current.cache().then(function() {
          window.location.reload();
        });
      } else {
        window.location.reload();
      }
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
        if('bucket_id' in data) {
          data.bucket = t.bucket.get(data.bucket_id);
        }
        if('item_id' in data) {
          data.item = t.item.get(data.item_id);
        }
      }
      if(route.tpl.indexOf('external') !== 0 && !document.getElementById('dash-main')) {
        if(!t.view.isset('team')) {
          t.gotoUrl('/account');
        }
        document.getElementById('page').innerHTML = t.view.render("layout/dashboard", data, true);
        run_template_js(document.getElementById('page'));
        target = "dash-main";
      } else if (route.tpl.indexOf('external') === 0 && loaded && target != "page") {
        t.view.unset('team');
        target = "page";
      }
      nav_queue.forEach(function(fn) {
        fn();
      });
      nav_queue = [];
      var tar = document.getElementById(target);
      tar.innerHTML = t.view.render(route.tpl, data);
      if(tar.firstChild) {
        var class_list = tar.firstChild.classList;
        if(class_list.contains('require-auth') && !t.acct.isAuthed()) {
          return t.gotoUrl('/login');
        }
        if(class_list.contains('require-no-auth') && t.acct.isAuthed()) {
          return t.gotoUrl('/account');
        }
        if(class_list.contains('require-team') && !t.view.isset('team')) {
          return t.gotoUrl('/account');
        }
        if(class_list.contains('require-bucket') && data.bucket) {
          return t.gotoUrl('/dashboard');
        }
        if(class_list.contains('require-item') && data.item) {
          return t.gotoUrl('/dashboard');
        }
      }
      run_template_js(tar);
      if(loaded) {
        tar.scrollTop = 0;
      }
      scrollToSub(hash, loaded);
      if(loaded) {
        t.audio.play('click', 1);
      }
      last_hash = hash;
      loaded = true;
    });
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
        if(e.which !== 1) {
          return;
        }
        if(e.target.nodeName == 'A') {
          e.target.click();
        }
        if(e.target.parentNode.nodeName == 'A') {
          e.target.parentNode.click();
        }
      });
      document.body.addEventListener('click', function(e) {
        var el = e.target;
        if(el.nodeName != 'A' && el.parentNode.nodeName == 'A') {
          el = e.target.parentNode;
        } else if(el.nodeName != 'A') {
          return;
        }
        if(anchorClass(el, 'replace')) {
          e.preventDefault();
          t.gotoUrl(el.getAttribute('href').substr(1), true);
          return;
        }
        if(anchorClass(el, 'logout')) {
          e.preventDefault();
          t.acct.deAuth();
          t.gotoUrl('/login');
          return;
        }
        if(anchorClass(el, 'force')) {
          e.preventDefault();
          hashChange(el.getAttribute('href').substr(1));
          return;
        }
      });

      FastClick.attach(document.body);

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

  var run_template_js = function(tar) {
    var els = tar.querySelectorAll('[data-tpljs]');
    for(var i = 0; els[i]; i++) {
      var el = els[i],
        tplname = el.getAttribute('data-tpljs');
      if(tplname in template_js) {
        template_js[tplname](t);
      }
    }

  };

  t.updateRightNav = function() {
    var right = document.getElementById('right');
    right.innerHTML = t.view.render('dashboard/right');
    run_template_js(right);
  }

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

  return t;

})(Teambo || {});
