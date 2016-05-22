(function(t){
    "use strict";

    var theme_styles = t.view.render('dashboard/theme'),
        url = sjcl.codec.base64.fromBits(sjcl.codec.utf8String.toBits(theme_styles));

    t.id('theme').href = "data:text/css;base64,"+url;
    t.updateStatus();

})(Teambo);
