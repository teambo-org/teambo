Teambo.socket = (function (t) {
  "use strict";

  var socket = function(data) {
    var self = this;
    t.object.extend(this, {
      interval: null,
      connect: null,
      connection: null
    });
    t.object.extend(this, data);

    this.stop = function() {
      self.connect = false;
      clearInterval(self.interval);
      if(self.connection) {
        self.connection.close();
      }
      self.emit('stop');
    };

    this.start = function() {
      var failures = 0;
      self.emit('start');
      self.connect = true;
      var connected = false;
      var wrapperfunc = function(){
        if (typeof(WebSocket) === "function" && (!self.connection || self.connection.readyState > 0)) {
          if(connected) {
            return;
          }
          var uri = new Uri(window.location);
          var host = uri.host();
          var scheme = uri.protocol() == 'https' ? 'wss' : 'ws';
          var port = uri.port() ? ':' + uri.port() : '';
          var url = self.url();
          if(!url) {
            return;
          }
          self.connection = new WebSocket(scheme+"://"+host+port+url);
          connected = true;
          self.connection.onclose = function(evt) {
            failures++;
            connected = false;
          }
          self.connection.onmessage = function(evt) {
            t.app.online = true;
            failures = 0;
            if(evt.ts && typeof evt.ts === 'number') {
              evt.ts = '' + evt.ts;
            }
            try {
              var data = JSON.parse(evt.data);
              self.emit('message', data);
            } catch(e) {
              t.app.log('Socket event parse failed: ' + evt);
              t.app.log(e);
            }
          }
        }
      };
      wrapperfunc();
      self.interval = setInterval(wrapperfunc, (failures < 5 ? 1 : 60)*1000);
    };

    t.event.extend(this);
  };

  return socket;

})(Teambo);
