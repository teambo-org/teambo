(function(t){
    "use strict";

    t.chat.init({
        autoclose: t.id('chat').getAttribute('data-autoclose') == "true"
    });

})(Teambo);
