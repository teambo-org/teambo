xdescribe("Stress", function() {

  // var factor = 100;
  var factor = 50;

  xit("Performs well with "+factor+" folders each having "+factor+" items", function(done) {
    var i = 0;
    var j = 0;
    var el = document.createElement('div');
    el.id = 'progress';
    el.style.padding = '2em';
    el.style.fontSize = '2em';
    window.document.body.appendChild(el);
    var create_folders = function() {
      return new Promise(function(fulfill, reject) {
        Teambo.model.folder.create({name: 'Test Folder '+i}).then(function(folder) {
          j = 0;
          create_items(folder).then(function() {
            i++;
            if(i < factor) {
              create_folders().then(function(){
                fulfill();
              });
            } else {
              fulfill();
            }
          });
        });
      });
    };
    var create_items = function(folder) {
      return new Promise(function(fulfill, reject) {
        Teambo.model.item.create({name: 'Test Item ' + j, status: 'ready', description: 'This is a test item', folder_id: folder.id}).then(function() {
          j++;
          el.innerHTML = 'Created objects: ' + (j + i*factor);
          if(j < factor) {
            create_items(folder).then(function(){
              fulfill();
            });
          } else {
            fulfill();
          }
        });
      });
    };
    create_folders().then(function(){
      expect(Teambo.model.folder.all.length > factor).toBe(true);
      expect(Teambo.model.item.all.length > factor * factor).toBe(true);
      done();
    });
  }, Math.pow(2, 31) - 1 /* max execution time = max_32_int */);

});
