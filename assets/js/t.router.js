Teambo.router = (function(t){
  "use strict";

  var routes = [];
  var plain_routes = {
    '' : 'external/index',
    '/:team_id'                            : 'team/dashboard',
    '/:team_id/outbox'                     : 'team/outbox',
    '/:team_id/buckets'                    : 'team/bucket/index',
    '/:team_id/members'                    : 'team/member/index',
    '/:team_id/edit'                       : 'team/settings/edit',
    '/:team_id/remove'                     : 'team/settings/remove',
    '/:team_id/new'                        : 'team/bucket/new',
    '/:team_id/wiki'                       : 'team/wiki/index',
    '/:team_id/wiki/new'                   : 'team/wiki/new',
    '/:team_id/wiki/:wiki_id/new'          : 'team/wiki/new',
    '/:team_id/wiki/:wiki_id'              : 'team/wiki/view',
    '/:team_id/wiki/:wiki_id/remove'       : 'team/wiki/remove',
    '/:team_id/wiki/:wiki_id/edit'         : 'team/wiki/edit',
    '/:team_id/plan'                       : 'team/plan/index',
    '/:team_id/plan/new'                   : 'team/plan/new',
    '/:team_id/plan/:plan_id'              : 'team/plan/view',
    '/:team_id/plan/:plan_id/remove'       : 'team/plan/remove',
    '/:team_id/plan/:plan_id/edit'         : 'team/plan/edit',
    '/:team_id/plan/:plan_id/new'                  : 'team/item/new',
    '/:team_id/plan/:plan_id/item/:item_id'        : 'team/item/view',
    '/:team_id/plan/:plan_id/item/:item_id/edit'   : 'team/item/edit',
    '/:team_id/plan/:plan_id/item/:item_id/remove' : 'team/item/remove',
    '/:team_id/plan/:plan_id/item/:item_id/comment/:comment_id/edit'   : 'team/comment/edit',
    '/:team_id/plan/:plan_id/item/:item_id/comment/:comment_id/remove' : 'team/comment/remove',
    '/:team_id/comment/:comment_id/edit'   : 'team/comment/edit',
    '/:team_id/comment/:comment_id/remove' : 'team/comment/remove',
    '/:team_id/bucket/:bucket_id'          : 'team/bucket/view',
    '/:team_id/bucket/:bucket_id/remove'   : 'team/bucket/remove',
    '/:team_id/bucket/:bucket_id/edit'     : 'team/bucket/edit',
    '/:team_id/bucket/:bucket_id/new'      : 'team/item/new',
    '/:team_id/item/:item_id'              : 'team/item/view',
    '/:team_id/item/:item_id/edit'         : 'team/item/edit',
    '/:team_id/item/:item_id/remove'       : 'team/item/remove',
    '/:team_id/item/:item_id/comment/:comment_id/edit'   : 'team/comment/edit',
    '/:team_id/item/:item_id/comment/:comment_id/remove' : 'team/comment/remove',
    '/:team_id/members/new'                : 'team/member/new',
    '/:team_id/member/:member_id'          : 'team/member/view',
    '/:team_id/member/:member_id/edit'     : 'team/member/edit',
    '/:team_id/member/:member_id/remove'   : 'team/member/remove',
    '/:team_id/member/:member_id/leave'    : 'team/member/leave'
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
