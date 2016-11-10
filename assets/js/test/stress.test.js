xdescribe("Stress", function() {

  // var factor = 100;
  var factor = 50;

  it("Performs well with "+factor+" buckets each having "+factor+" items", function(done) {
    var i = 0;
    var j = 0;
    var el = document.createElement('div');
    el.id = 'progress';
    el.style.padding = '2em';
    el.style.fontSize = '2em';
    window.document.body.appendChild(el);
    var create_buckets = function() {
      return new Promise(function(fulfill, reject) {
        Teambo.model.bucket.create({name: 'Test Bucket '+i}).then(function(bucket) {
          j = 0;
          create_items(bucket).then(function() {
            i++;
            if(i < factor) {
              create_buckets().then(function(){
                fulfill();
              });
            } else {
              fulfill();
            }
          });
        });
      });
    };
    var create_items = function(bucket) {
      return new Promise(function(fulfill, reject) {
        Teambo.model.item.create({name: 'Test Item ' + j, status: 'ready', description: 'This is a test item', bucket_id: bucket.id}).then(function() {
          j++;
          el.innerHTML = 'Created objects: ' + (j + i*factor);
          if(j < factor) {
            create_items(bucket).then(function(){
              fulfill();
            });
          } else {
            fulfill();
          }
        });
      });
    };
    create_buckets().then(function(){
      done();
    });
  }, Math.pow(2, 31) - 1 /* max execution time = max_32_int */);

});
