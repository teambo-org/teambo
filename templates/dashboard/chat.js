(function(t){
    "use strict";

    t.chat.init({
        autoclose: document.getElementById('chat').getAttribute('data-autoclose') == "true"
    });

})(Teambo);
