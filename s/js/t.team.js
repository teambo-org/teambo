(function(){
    "use strict";
    
    t.team = function(data) {
        var pbk = data.pbk;
        t.extend(this, {
            hash:       data.hash,
            akey:       data.akey,
            name:       data.name,
            opts:       data.opts       ? data.opts : {},
            milestones: data.milestones ? data.opts : {}
        });
    };
    
    t.team.create = function(name) {
        if(!t.acct.isAuthed()) {
            return Promise.reject('Not authed');
        }
        return t.promise(function(fulfill, reject) {
            t.xhr.post('/team').then(function(xhr){
                if(xhr.status == 200) {
                    var data = JSON.parse(xhr.responseText);
                    var team = new t.team({
                        name: name,
                        hash: data.hash,
                        akey: data.akey,
                        pbk:  t.crypto.randomKey()
                    });
                    t.acct.team.add(team);
                    t.acct.save().then(function(xhr){
                        fulfill(team);
                    }).catch(function(e){
                        t.acct.team.remove(team);
                        reject(xhr);
                    });
                } else {
                    reject(xhr);
                }
            }).catch(function(e){
                reject(e);
            });
        });
    };

})();