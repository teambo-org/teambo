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
    }
  };

  var linkify = function (text) {
    var r = ' ' +  text + ' ',
      domainRegEx = "([\\w]+\\.)+(com|org|net|gov|edu|mil|biz|cat|int|pro|tel|xxx|jobs|arpa|coop|asia|info|mobi|name|aero|jobs|museum|travel|[a-z]{2})",
      ipRegEx = "((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)",
      pathRegEx = "([\\/(&#x2F;)\\?\\#]+[^ \\\"\\t\\n\\r\\<\\{\\}]*)?",
      chr = "<span class=\"chr\">&#xa71b;</span>";
    r = r.replace(new RegExp("(^|\\n| )(mailto:)?([a-z0-9&\\-_\\.]+@"+domainRegEx+")([^\\w]{1})", "ig"),                     "$1<a target=\"_blank\" rel=\"nofollow noopener noreferrer\" href=\"mailto:$3\">$3</a>"+chr+"$6");
    r = r.replace(new RegExp("(^|\\n| )((https?|ftp|irc):&#x2F;&#x2F;("+domainRegEx+"|"+ipRegEx+")(\\:[0-9]+)?"+pathRegEx+")([^\\w]{1})", "ig"), "$1<a target=\"_blank\" rel=\"nofollow noopener noreferrer\" href=\"$2\">$2</a>"+chr+"$1");
    r = r.replace(new RegExp("(^|\\n| )(("+domainRegEx+"|"+ipRegEx+")(\\:[0-9]+)?"+pathRegEx+")([^\\w]{1})", "ig"),                "$1<a target=\"_blank\" rel=\"nofollow noopener noreferrer\" href=\"http:&#x2F;&#x2F;$2\">$2</a>"+chr+"$1");
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
    render('left', 'team/layout/left');
    render('chat', 'team/layout/chat');
    t.updateStatus();
  };

  var init = function(opts) {
    templates = opts.templates;
    template_js = opts.template_js;

    if(window.applicationCache.status !== 0) {
      window.applicationCache.addEventListener('updateready', function(e) {
        if(window.applicationCache.status === window.applicationCache.UPDATEREADY
        || window.applicationCache.status === window.applicationCache.CHECKING) {
          if(!t.moved() && !t.editing()) {
            if(t.acct.current) {
              t.acct.current.cacheAuth()
              window.location.reload();
            } else {
              window.location.reload();
            }
          } else {
            t.updateReady(true);
          }
        }
        t.online(true);
      }, false);
      window.applicationCache.addEventListener('noupdate', function(e) {
        t.online(true);
      }, false);
      window.applicationCache.addEventListener('error', function(e) {
        t.online(false);
      }, false);
      var startCacheCheck = function() {
        if(!t.updateReady()) {
          setTimeout(function(){
            window.applicationCache.update();
            startCacheCheck();
          }, 30000);
        }
      };
      if(window.applicationCache.status === 3) {
        window.applicationCache.addEventListener('cached', function(e) {
          window.applicationCache.update();
          startCacheCheck();
        }, false);
      } else {
        window.applicationCache.update();
        startCacheCheck();
      }
    }

    document.body.addEventListener('mousedown', function(e) {
      if(e.which !== 1) {
        return;
      }
      var el = t.matchParent(e.target, 'a');
      if(el) {
        el.click();
      }
    });
    document.body.addEventListener('click', function(e) {
      var el = t.matchParent(e.target, 'a');
      if(!el) {
        return;
      }
      if(el.matches('.replace')) {
        e.preventDefault();
        t.gotoUrl(el.getAttribute('href').substr(1), true);
        return;
      }
      if(el.matches('.logout')) {
        e.preventDefault();
        t.acct.deAuth();
        t.gotoUrl('/login');
        return;
      }
      if(el.matches('.force')) {
        e.preventDefault();
        hashChange(el.getAttribute('href').substr(1));
        return;
      }
    });
    FastClick.attach(document.body);
  };

  var renderTemplate = function(tplname, data, override) {
    data = data ? data : {};
    override = override ? override : {};
    t.extend(data, obj);
    t.extend(data, override);
    var html = Mustache.render(
      templates[tplname],
      data,
      templates
    );
    return html;
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

  var render = function(target, tplname, data, override) {
    data = data ? data : {};
    override = override ? override : {};
    if(typeof target === "string") {
      target = document.getElementById(target);
    }
    target.innerHTML = renderTemplate(tplname, data, override);
    if(target.firstChild) {
      var class_list = target.firstChild.classList;
      if(class_list.contains('require-auth') && !t.acct.isAuthed()) {
        return t.gotoUrl('/login');
      }
      if(class_list.contains('require-no-auth') && t.acct.isAuthed()) {
        return t.gotoUrl('/account');
      }
      if(class_list.contains('require-team') && !view.isset('team')) {
        return t.gotoUrl('/account');
      }
      if(class_list.contains('require-bucket') && !data.bucket) {
        return t.gotoUrl('/dashboard');
      }
      if(class_list.contains('require-item') && !data.item) {
        return t.gotoUrl('/dashboard');
      }
    }
    if(tplname in template_js) {
      template_js[tplname](t);
    }
    // TODO: replace this with data binding?
    var els = document.querySelectorAll('a[data-obj^=bucket-]');
    for(var i = 0; els[i]; i++) {
      els[i].classList.remove('active');
      if('bucket' in data && els[i].dataset.obj == 'bucket-'+data.bucket.id) {
        els[i].classList.add('active');
      }
    }
    var els = document.querySelectorAll('a[data-obj^=item-]');
    for(var i = 0; els[i]; i++) {
      els[i].classList.remove('active');
      if('item' in data && els[i].dataset.obj == 'item-'+data.item.id) {
        els[i].classList.add('active');
      }
    }
    if(t.loaded()) {
      target.scrollTop = 0;
    }
  };

  t.event.on('object-removed', function(e) {
    updateSideNav();
    var team   = view.get('team');
    var bucket = view.get('bucket');
    var item   = view.get('item');
    if(e.type == 'bucket' && bucket && bucket.id == e.id) {
      t.gotoUrl(team.url(), false, {silent: true});
      // show message
    } else if(e.type == 'bucket' && !bucket) {
      t.refresh({silent: true});
    } else if(e.type == 'item' && bucket && (!item || item.id == e.id)) {
      t.gotoUrl(bucket.url(), false, {silent: true});
      // show message
    }
  });

  t.event.on('object-updated', function(e) {
    updateSideNav();
    var bucket = view.get('bucket');
    var item   = view.get('item');
    var m = e.type in t ? t[e.type].get(e.id) : null;
    if(e.type == 'bucket' && bucket && bucket.id == e.id) {
      if(!t.editing()) {
        t.refresh({silent: true});
      } else {
        // show message
      }
    } else if(e.type == 'bucket' && !bucket) {
      t.refresh({silent: true});
    } else if(e.type == 'item' && (m && bucket && bucket.id == m.opts.bucket_id && !item) || (item && item.id == e.id)) {
      if(!t.editing()) {
        t.refresh({silent: true});
      } else {
        // show message
      }
    }
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
    updateTheme: update_theme,
    updateSideNav: updateSideNav
  };

  return view;

})(Teambo);