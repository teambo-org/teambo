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
    codeblock: function() {
      return function(text, render) {
        return render(text).replace(/&#x60;&#x60;&#x60;/g, "```").replace(new RegExp("```([^`]*)```", "ig"), "<pre>$1</pre>");
      };
    },
    inf : function() {
      return function(text, render) {
        return parseInt(render(text)) === 1 ? '' : 's';
      };
    },
    localTime : function() {
      return function(text, render) {
        var ts = parseInt(render(text)) - new Date().getTimezoneOffset() * 60 * 1000;
        if(!ts) {
          return;
        }
        return new Date(ts).toISOString().slice(0, 16).replace('T', '&nbsp;&nbsp;');
      };
    },
    ui: {
      left_toggle: {plan: true, item: true, member: true, settings: true}
    }
  };

  var linkify = function (text) {
    var r = ' ' +  text + ' ',
      domainRegEx = "([a-zA-Z0-9-]+\\.)+(com|org|net|gov|edu|mil|biz|cat|int|pro|tel|xxx|jobs|arpa|coop|asia|info|mobi|name|aero|jobs|museum|travel|[a-z]{2})",
      ipRegEx = "((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)",
      pathRegEx = "([\\/(&#x2F;)\\?\\#]+([^ \\\"\\t\\n\\r\\<\\{\\}]*))?",
      chr = "<span class=\"chr\">&#xa71b;</span>";
    r = r.replace(new RegExp("(^|\\n| )(mailto:)?([a-z0-9&\\-_\\.]+@"+domainRegEx+")([^\\w]{1})", "ig"), "$1<a target=\"_blank\" rel=\"nofollow noopener noreferrer\" href=\"mailto:$3\">$3"+chr+"</a>$6");
    r = r.replace(new RegExp("(^|\\n| )((https?|ftp|irc):&#x2F;&#x2F;("+domainRegEx+"|"+ipRegEx+")([^\\w]{1})?"+pathRegEx+")", "ig"), "$1<a target=\"_blank\" rel=\"nofollow noopener noreferrer\" href=\"$2\">$2"+chr+"</a>");
    r = r.replace(new RegExp("(^|\\n| )(("+domainRegEx+"|"+ipRegEx+")(\\:[0-9]+)?"+pathRegEx+")", "ig"), "$1<a target=\"_blank\" rel=\"nofollow noopener noreferrer\" href=\"http:&#x2F;&#x2F;$2\">$2"+chr+"</a>");
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
    var theme_styles = renderTemplate('team/layout/theme', {}, data);
    var url = sjcl.codec.base64.fromBits(sjcl.codec.utf8String.toBits(theme_styles));
    document.getElementById('theme').href = "data:text/css;base64,"+url;
  };

  var updateSideNav = function() {
    render('right', 'team/layout/right');
    render('left',  'team/layout/left');
    render('chat',  'team/layout/chat');
    updateStatus();
  };

  var updateStatus = function() {
    var el = document.getElementById('status');
    if(el) {
      el.innerHTML = renderTemplate('team/layout/status');
      el.classList.remove('online');
      el.classList.remove('offline');
      el.classList.add(t.app.online ? 'online' : 'offline');
    }
  };

  var init = function(opts) {
    templates = opts.templates;
    template_js = opts.template_js;

    obj.app = t.app;
    obj.apps = t.apps;
    obj.acct = t.acct;
    obj.model = t.model;
    obj.chat = t.chat;

    t.app.watchProperty('online', function(prop, old_val, new_val) {
      if(old_val != new_val) {
        updateStatus();
      }
    });

    t.app.watchProperty('updateready', function(prop, old_val, new_val) {
      if(old_val != new_val) {
        updateStatus();
      }
    });

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
        t.app.replaceUrl(el.getAttribute('href').substr(1));
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
        t.app.replaceUrl(el.getAttribute('href').substr(1));
        return;
      }
    });
    FastClick.attach(document.body);
  };

  var renderTemplate = function(tplname, data, override) {
    override = override ? override : {};
    data = data ? t.object.extend({}, data) : {};
    t.object.extend(data, obj);
    t.object.extend(data, override);
    var html = Mustache.render(
      templates[tplname],
      data,
      templates
    );
    return html;
  };

  var render = function(target, tplname, data, override) {
    data = data ? data : {};
    override = override ? override : {};
    if(typeof target === "string") {
      target = document.getElementById(target);
    }
    if(!target) {
      return false;
    }
    if(tplname+'.pre' in template_js) {
      if(template_js[tplname+'.pre'](t) === false) {
        return false;
      }
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
    scrollToSub(target, window.location.hash);
  };

  var scrollToSub = function(tar, hash) {
    var parts = hash.split('..');
    var el = document.getElementById(parts[1]);
    if(parts.length > 1 && el) {
      var add = tar.offsetHeight - el.offsetHeight;
      el.classList.add('hi');
      tar.parentNode.scrollTop = Math.max(add/4, 10);
    } else if (t.app.loaded){
      tar.parentNode.scrollTop = 0;
    }
  };

  t.event.on('team-init', function(team) {
    return t.team.findCached('left_toggle').then(function(val) {
      var data = {};
      if(val) {
        data = JSON.parse(val);
      }
      obj.ui.left_toggle = t.object.extend(obj.ui.left_toggle, data);
    });
  });

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

  t.event.on('nav', function() {
    var el = document.getElementById('skipnav');
    if(el) {
      if(!t.dom.isChild('right', document.activeElement) && !t.dom.isChild('left', document.activeElement)) {
        el.focus();
      }
    }
  });

  return view;

})(Teambo);
