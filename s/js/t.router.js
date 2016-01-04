(function(){
    "use strict";
    
    var routes = [],
        plain_routes = {
            '' : 'external/index'
        };
    
    t.router = {};
    
    t.router.init = function(templates) {
        for(var i in plain_routes) {
            var m = i.match(/\:([a-z]+)/g);
            m = m ? m : []
            for (var j in m) {
                m[j] = m[j].substr(1);
            }
            routes.push({
                route: new RegExp('^'+i.replace(/\:([a-z]+)/g, '([^/]+)')+'$'),
                tpl: plain_routes[i],
                vars: m
            });
        }
        
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
    }
    
    t.router.find = function(url) {
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
    };
    
})();
