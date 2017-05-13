Teambo.socket = (function (t) {
  "use strict";

  var socket = function(data) {
    var self = this;
    t.object.extend(this, {
      interval: null,
      connect: null,
      connection: null,
      connected: false
    });
    t.object.extend(this, data);

    this.stop = function() {
      self.connect = false;
      self.connected = false;
      clearInterval(self.interval);
      if(self.connection) {
        self.connection.close();
      }
    };

    this.start = function() {
      self.stop();
      var failures = 0;
      self.connect = true;
      var wrapperfunc = function(){
        if (typeof(WebSocket) === "function" && (!self.connection || self.connection.readyState > 0)) {
          if(self.connected) {
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
          self.connected = true;
          self.connection.onclose = function(evt) {
            failures++;
            self.connected = false;
            self.connection = null;
            // if(self.connect) {
              // t.app.online = false;
            // }
          }
          self.connection.onmessage = function(evt) {
            t.app.online = true;
            failures = 0;
            self.emit('message', evt);
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
