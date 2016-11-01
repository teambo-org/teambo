Teambo.router = (function(t){
  "use strict";

  var routes = [];
  var plain_routes = {
    '' : 'external/index',
    '/:team_id'                            : 'team/dashboard',
    '/:team_id/members'                    : 'team/members',
    '/:team_id/edit'                       : 'team/edit',
    '/:team_id/new'                        : 'team/bucket/new',
    '/:team_id/:bucket_id'                 : 'team/bucket/view',
    '/:team_id/:bucket_id/remove'          : 'team/bucket/remove',
    '/:team_id/:bucket_id/edit'            : 'team/bucket/edit',
    '/:team_id/:bucket_id/new'             : 'team/item/new',
    '/:team_id/:bucket_id/:item_id'        : 'team/item/view',
    '/:team_id/:bucket_id/:item_id/edit'   : 'team/item/edit',
    '/:team_id/:bucket_id/:item_id/remove' : 'team/item/remove'
  };

  return {
    init: function(templates) {
      for(i in templates) {
        if(i.indexOf('index/') === 0) {
          routes.push({
            route: new RegExp('^'+i.substr(5)+'$'),
            tpl: i,
            vars: []
          });
        } else if(i.indexOf('external/') === 0) {
          routes.push({
            route: new RegExp('^'+i.substr(8)+'$'),
            tpl: i,
            vars: []
          });
        }
      }
      for(var i in plain_routes) {
        var m = i.match(/\:([a-z_]+)/g);
        m = m ? m : []
        m.forEach(function(v, j) {
          m[j] = m[j].substr(1);
        });
        routes.push({
          route: new RegExp('^'+i.replace(/\:([a-z_]+)/g, '([^/]+)')+'$'),
          tpl: plain_routes[i],
          vars: m
        });
      }
    },
    find: function(url) {
      for (var i in routes) {
        if(routes[i].route.test(url)) {
          var route = routes[i],
            m = routes[i].route.exec(url);
          route.data = {};
          for(var j in route.vars) {
            route.data[route.vars[j]] = m[parseInt(j)+1];
          }
          return route;
        }
      }
      return
    }
  };

})(Teambo);
