function(t){
  "use strict";

  t.view.updateTheme();
  t.view.updateSideNav();
  t.updateStatus();

  t.chat.init({
      autoclose: document.getElementById('chat').getAttribute('data-autoclose') === "true"
  });

}
