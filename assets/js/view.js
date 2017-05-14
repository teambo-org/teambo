Teambo.view = (function(t){
  "use strict";

  var templates   = {};
  var template_js = {};
  var obj = {
    linkify : function() {
      return function(text, render) {
        return linkify(render(text));
      }
    },
    urle : function() {
      return function(text, render) {
        return encodeURIComponent(render(text));
      };
    },
    nl2br: function() {
      return function(text, render) {
        return render(text).split("\r").join("[r]").split("\n").join("<br/>");
      };
    },
    chat: {
      autoclose: true
    },
    inf : function() {
      return function(text, render) {
        return parseInt(render(text)) === 1 ? '' : 's';
      };
    },
    localTime : function() {
      return function(text, render) {
        var ts = parseInt(render(text)) - new Date().getTimezoneOffset() * 60 * 1000;
        return new Date(ts).toISOString().slice(0, 16).replace('T', '&nbsp;&nbsp;');
      };
    }
  };

  var linkify = function (text) {
    var r = ' ' +  text + ' ',
      domainRegEx = "([\\w]+\\.)+(com|org|net|gov|edu|mil|biz|cat|int|pro|tel|xxx|jobs|arpa|coop|asia|info|mobi|name|aero|jobs|museum|travel|[a-z]{2})",
      ipRegEx = "((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)",
      pathRegEx = "([\\/(&#x2F;)\\?\\#]+([^ \\\"\\t\\n\\r\\<\\{\\}]*))?",
      chr = "<span class=\"chr\">&#xa71b;</span>";
    r = r.replace(new RegExp("(^|\\n| )(mailto:)?([a-z0-9&\\-_\\.]+@"+domainRegEx+")([^\\w]{1})", "ig"), "$1<a target=\"_blank\" rel=\"nofollow noopener noreferrer\" href=\"mailto:$3\">$3</a>"+chr+"$6");
    r = r.replace(new RegExp("(^|\\n| )((https?|ftp|irc):&#x2F;&#x2F;("+domainRegEx+"|"+ipRegEx+")([^\\w]{1})?"+pathRegEx+")([^\\w]{1})", "ig"), "$1<a target=\"_blank\" rel=\"nofollow noopener noreferrer\" href=\"$2\">$2</a>"+chr+"$13");
    r = r.replace(new RegExp("(^|\\n| )(("+domainRegEx+"|"+ipRegEx+")(\\:[0-9]+)?"+pathRegEx+")", "ig"), "$1<a target=\"_blank\" rel=\"nofollow noopener noreferrer\" href=\"http:&#x2F;&#x2F;$2\">$2</a>"+chr);
    return r.slice(1,-1);
  };

  var update_theme = function(theme) {
    var data = {};
    if(theme) {
      var res_theme;
      if(typeof(theme) === "object") {
        res_theme = theme;
      } else if(typeof(theme) === "string" && theme in t.themes) {
        res_theme = t.themes[theme];
      }
      if(res_theme) {
        data = {
          team: {
            theme: function(){ return res_theme; }
          }
        };
      }
    }
    var theme_styles = renderTemplate('layout/theme', {}, data);
    var url = sjcl.codec.base64.fromBits(sjcl.codec.utf8String.toBits(theme_styles));
    document.getElementById('theme').href = "data:text/css;base64,"+url;
  };

  var updateSideNav = function() {
    render('right', 'layout/right');
    render('left',  'layout/left');
    render('chat',  'layout/chat');
    updateStatus();
  };

  var updateStatus = function() {
    var el = document.getElementById('status');
    if(el) {
      el.innerHTML = renderTemplate('layout/status');
      el.classList.value = t.app.online ? 'online' : 'offline';
    }
  };

  var init = function(opts) {
    templates = opts.templates;
    template_js = opts.template_js;

    obj.app = t.app;
    obj.acct = t.acct;
    obj.model = t.model;

    t.app.watch('online', function(prop, old_val, new_val) {
      if(old_val != new_val) {
        updateStatus();
      }
    });

    if(window.applicationCache.status !== 0) {
      window.applicationCache.addEventListener('updateready', function(e) {
        if(window.applicationCache.status === window.applicationCache.UPDATEREADY
        || window.applicationCache.status === window.applicationCache.CHECKING) {
          if(!t.app.moved && !t.app.editing && (!t.team.current || !t.team.current.queue || !t.team.current.queue.processing)) {
            t.app.reload();
          } else {
            t.app.updateready = true;
            updateStatus();
          }
        }
        t.app.online = true;
      }, false);
      window.applicationCache.addEventListener('noupdate', function(e) {
        t.app.moved = true;
        t.app.online = true;
      }, false);
      window.applicationCache.addEventListener('error', function(e) {
        t.app.online = false;
      }, false);
      var startCacheCheck = function() {
        if(!t.app.updateready) {
          setTimeout(function(){
            window.applicationCache.update();
            startCacheCheck();
          }, t.app.online ? 60000 : 3000);
        }
      };
      if(window.applicationCache.status === 3) {
        window.applicationCache.addEventListener('cached', function(e) {
          t.app.online = true;
          startCacheCheck();
        }, false);
      } else {
        startCacheCheck();
      }
    }

    document.body.addEventListener('mousedown', function(e) {
      if(e.which !== 1) {
        return;
      }
      var el = t.dom.matchParent(e.target, 'a');
      if(el) {
        el.click();
      }
    });
    document.body.addEventListener('click', function(e) {
      var el = t.dom.matchParent(e.target, 'a');
      if(!el) {
        return;
      }
      if(el.matches('.replace')) {
        e.preventDefault();
        t.app.gotoUrl(el.getAttribute('href').substr(1), true);
        return;
      }
      if(el.matches('.logout')) {
        e.preventDefault();
        t.acct.deAuth();
        t.app.gotoUrl('/login');
        return;
      }
      if(el.matches('.force')) {
        e.preventDefault();
        t.app.gotoUrl(el.getAttribute('href').substr(1), true);
        return;
      }
    });
    FastClick.attach(document.body);
  };

  var renderTemplate = function(tplname, data, override) {
    data = data ? data : {};
    override = override ? override : {};
    t.object.extend(data, obj);
    t.object.extend(data, override);
    var html = Mustache.render(
      templates[tplname],
      data,
      templates
    );
    return html;
  };

  var scrollToSub = function(hash, isLoaded) {
    var parts = hash.split('..');
    var el = document.getElementById(parts[1]);
    var tar = document.getElementById(t.app.target);
    if(parts.length > 1 && el) {
      var add = tar.offsetHeight - el.offsetHeight;
      el.classList.add('hi');
      tar.parentNode.scrollTop = Math.max(add/4, 10);
    } else if (isLoaded){
      tar.parentNode.scrollTop = 0;
    }
  };

  var render = function(target, tplname, data, override) {
    data = data ? data : {};
    override = override ? override : {};
    if(typeof target === "string") {
      target = document.getElementById(target);
    }
    if(!target) {
      return;
    }
    target.innerHTML = renderTemplate(tplname, data, override);
    if(target.firstChild && target.firstChild.classList) {
      var class_list = target.firstChild.classList;
      if(class_list.contains('require-auth') && !t.acct.isAuthed()) {
        t.app.afterAuth = window.location.hash.substr(1);
        return t.app.gotoUrl('/login');
      }
      if(class_list.contains('require-no-auth') && t.acct.isAuthed()) {
        t.app.afterAuth = window.location.hash.substr(1);
        return t.app.gotoUrl('/account');
      }
      if(class_list.contains('require-team') && !view.isset('team')) {
        t.app.afterAuth = window.location.hash.substr(1);
        return t.app.gotoUrl('/account');
      }
      var models = target.firstChild.getAttribute('require-model');
      if(models) {
        models.split(' ').forEach(function(type) {
          if(type in view.obj && !view.obj[type].current) {
            return t.app.gotoUrl(t.team.current ? t.team.current.url() : '/account');
          }
        });
      }
    }
    if(tplname in template_js) {
      template_js[tplname](t);
    }
    if(t.app.loaded && target.id === 'main') {
      target.scrollTop = 0;
    }
  };

  var view = {
    init: init,
    render: render,
    renderTemplate: renderTemplate,
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
    obj: obj,
    updateTheme:   update_theme,
    updateSideNav: updateSideNav,
    updateStatus:  updateStatus,
    escape: Mustache.escape
  };

  t.event.extend(view);
  t.event.on('pre-nav', function(){
    view.off();
  });

  return view;

})(Teambo);