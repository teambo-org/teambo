Teambo.socket = (function (t) {
  "use strict";

  var socket = {};

  socket.extend = function(socket) {
    t.extend(socket, {
      interval: null,
      connect: null,
      connection: null,
      connected: false
    });

    socket.stop = function() {
      socket.connect = false;
      socket.connected = false;
      clearInterval(socket.interval);
      if(socket.connection) {
        socket.connection.close();
      }
    };

    socket.start = function() {
      socket.stop();
      var failures = 0;
      socket.connect = true;
      var wrapperfunc = function(){
        if (typeof(WebSocket) === "function" && (!socket.connection || socket.connection.readyState > 0)) {
          if(socket.connected) {
            return;
          }
          var uri = new Uri(window.location);
          var host = uri.host();
          var scheme = uri.protocol() == 'https' ? 'wss' : 'ws';
          var port = uri.port() ? ':' + uri.port() : '';
          var url = socket.url();
          if(!url) {
            return;
          }
          socket.connection = new WebSocket(scheme+"://"+host+port+url);
          socket.connected = true;
          socket.connection.onclose = function(evt) {
            failures++;
            socket.connected = false;
            socket.connection = null;
            // if(socket.connect) {
              // t.online(false);
            // }
          }
          socket.connection.onmessage = function(evt) {
            t.online(true);
            failures = 0;
            socket.emit('message', evt);
          }
        }
      };
      wrapperfunc();
      socket.interval = setInterval(wrapperfunc, (failures < 3 ? 1 : 5)*1000);
    };

    t.event.extend(socket);

    return socket;
  };

  return socket;

})(Teambo);
