var Teambo = {};
Teambo.app = (function(t){
  "use strict";

  var app = {
    salt: null,
    loaded: false,
    moved: false,
    updateready: false,
    online: false,
    target: "page",
    last_hash: '',
    afterAuth: null,
    editing: false,
    debug: false,
    testing: false,
    remember_me: false,
    next_data: {}
  };

  app.init = function(opts) {
    if(app.loaded) {
      return;
    }
    t.object.extend(app, opts.app);
    t.object.watchable(app);
    t.view.init(opts);
    t.manifest.init();
    t.router.init(opts.templates);
    t.device.init().then(function() {
      t.acct.init().then(function(){
        window.onhashchange = app.refresh;
        app.refresh();
        t.audio.loadAll(opts.audio);
        t.async.loadJs(opts.jsasync);
      }).catch(function(e) {
        app.trace(e);
        t.acct.deAuth();
        // TODO: Fix infinite reload on serious app error
        // window.location.reload();
      });
    });
  };

  var hashChange = function(hash, data) {
    var uri = new Uri(hash);
    var path = uri.path().split('..')[0];
    var route = t.router.findClosest(path);
    data = t.object.extend(data || {}, uri.getQueryParams());
    var silent = data.silent ? data.silent : false;
    if(app.updateready) {
      app.reload();
      return;
    }
    if(!route) {
      app.log('route not found ' + hash);
      app.gotoUrl('/login');
      return;
    }
    t.object.extend(data, route.data);
    if(app.next_data) {
      t.object.extend(data, app.next_data);
    }
    app.next_data = {};
    var p = [];
    if('team_id' in data && (!(t.view.isset('team')) || t.view.get('team').id != data.team_id)) {
      if(t.acct.isAuthed()) {
        var logo = document.getElementById('logo');
        if(logo) {
          logo.classList.add('spinner');
        }
        if(t.team.current && data.team_id != t.team.current.id) {
          app.reload();
          return;
        }
        p.push(new Promise(function(fulfill, reject) {
          t.team.init(data.team_id).then(function(team){
            t.view.set('team', team);
            fulfill();
          }).catch(reject);
        }));
      } else {
        app.afterAuth = hash;
        app.gotoUrl('/login');
        return;
      }
    } else if(!('team_id' in data)) {
      t.team.reset();
    }
    var nav = function() {
      if(route.tpl.indexOf('external') !== 0 && !document.getElementById('main')) {
        if(!t.view.isset('team')) {
          app.gotoUrl('/account');
        }
        t.view.render('page', "team/layout", data);
        app.target = "main";
      } else if (route.tpl.indexOf('external') === 0 && app.loaded && app.target != "page") {
        // t.view.render('page', "external/layout", data);
        app.target = "page";
      }
      app.editing = false;
      t.event.all('pre-nav', route).then(function(){
        if(t.view.render(app.target, route.tpl, data) === false) {
          return;
        }
        if(app.loaded && !silent) {
          t.audio.play('click', 1);
        }
        t.event.emit('nav', route);
        if(app.last_hash != '' && app.last_hash != hash) {
          app.moved = true;
        }
        app.last_hash = hash;
        app.loaded = true;
        window.fractal && window.fractal.unpause();
      }).catch(function(e){
        app.trace(e);
        // app.gotoUrl('/'+window.location.hash.split('/').slice(1, -2).join('/'));
      });
    };
    if(p.length) {
      Promise.all(p).then(nav).catch(function(e) {
        if(e && e.status) {
          if(e.status === 403) {
            t.model.uncacheAll().then(function() {
              app.gotoUrl('/team/inaccessible', {tid: data.team_id});
              return;
            });
          } else if(e.status === 404) {
            app.gotoUrl('/team/missing', {tid: data.team_id});
            return;
          }
        }
        app.trace(e);
        app.gotoUrl('/team/error', {tid: data.team_id});
      });
    } else {
      nav();
    }
  };

  app.reload = function() {
    t.view.render('page', 'external/blank');
    // window.onbeforeunload = null;
    window.location.reload();
  };

  app.gotoUrl = function(href, data) {
    if(window.location.hash == "#"+href) {
      app.refresh(data);
    } else {
      if(typeof data === 'object') {
        app.next_data = data;
      }
      window.location.hash = "#"+href;
    }
  };

  app.refresh = function(data) {
    hashChange(window.location.hash.substr(1), data);
  };

  app.replaceUrl = function(url, data) {
    hashChange(url, data);
  };

  app.log = function(msg) {
    if('console' in window && app.debug) {
      if(typeof msg == 'object' && 'then' in msg) {
        msg.then(app.log);
      } else {
        window.console.log(msg);
      }
    }
  };

  app.trace = function(e) {
    if('console' in window && app.debug) {
      window.console.trace(e);
    }
  };

  return app;

})(Teambo || {});
