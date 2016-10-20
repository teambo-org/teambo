Teambo.chat = (function(t){

  var toggle_chat = function(state) {
    var dash = document.getElementById('dashboard'),
      collapsed = dash.classList.contains('chat-collapsed');
    if(state === 1) {
      if(collapsed) {
        dash.classList.remove('chat-collapsed');
      }
    } else if(state === 0) {
      if(!collapsed) {
        dash.classList.add('chat-collapsed');
      }
    } else {
      dash.classList.toggle('chat-collapsed');
    }
    var changed = collapsed != dash.classList.contains('chat-collapsed');
    if(changed && collapsed) {
      t.audio.play('woop2', 1);
    } else if(changed) {
      t.audio.play('woop1', 1);
    }
  };

	return {
    init: function(opts){
      document.getElementById('chat').addEventListener('click', function(e){
        if(e.target.classList.contains('toggle')
        || e.target.parentNode.classList.contains('toggle')) {
          e.preventDefault();
          toggle_chat();
        } else if(e.target.classList.contains('open')) {
          toggle_chat(1);
        }
      });
      var autoclose = function(e) {
        if(opts.autoclose) {
          toggle_chat(0);
        }
      }
      document.getElementById('main').addEventListener('click', autoclose);
      document.getElementById('right').addEventListener('click', autoclose);
    }
  };

})(Teambo);
