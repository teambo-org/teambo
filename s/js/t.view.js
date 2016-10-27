Teambo.view = (function(t){
  "use strict";

  var templates   = {},
    template_js = {},
    obj = {
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
      // markdown : function() {
        // return function(text, render) {
          // return micromarkdown.parse(render(text));
        // };
      // },
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
    var theme_styles = t.view.render('dashboard/theme', {}, data);
    var url = sjcl.codec.base64.fromBits(sjcl.codec.utf8String.toBits(theme_styles));
    document.getElementById('theme').href = "data:text/css;base64,"+url;
  };

  return {
    init: function(opts) {
      templates = opts.templates;
      template_js = opts.template_js;

      if(window.applicationCache.status !== 0) {
        window.applicationCache.addEventListener('updateready', function(e) {
          if(window.applicationCache.status === window.applicationCache.UPDATEREADY
          || window.applicationCache.status === window.applicationCache.CHECKING) {
            if(!t.moved() && !t.editing()) {
              t.acct.current.cache().then(function() {
                window.location.reload();
              });
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

        window.applicationCache.update();
        startCacheCheck();
      }
    },
    render: function(tplname, data, override) {
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
    },
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
    updateTheme: update_theme
  };

})(Teambo);
