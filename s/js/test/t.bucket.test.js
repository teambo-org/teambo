describe("Bucket", function() {

  it("Can be created", function(done) {
    Teambo.bucket.create({name: 'New Test Bucket'}).then(function(b){
      expect(b.opts.name).toBe("New Test Bucket");
      done();
    }).catch(function(e){
      fail("Team not found");
      done();
    });
  });

  it("Can be edited", function(done) {
    Teambo.bucket.findAll().then(function(buckets) {
      var bucket = buckets[0];
      bucket.update({name: 'Test Bucket'}).then(function(b){
        expect(b.opts.name).toBe("Test Bucket");
        done();
      }).catch(function(e){
        fail("Team not found");
        done();
      });
    });
  });

  it("Can be deleted", function(done) {
    Teambo.bucket.create({name: 'Bucket to Delete'}).then(function(b){
      b.remove().then(function(){
        Teambo.bucket.findAll().then(function(buckets) {
          expect(buckets.length).toBe(1);
          done();
        });
      }).catch(function(e){
        fail("Team not found");
        done();
      });
    }).catch(function(e){
      fail("Team not found");
      done();
    });
  });

  it("Can have description", function(done) {
    Teambo.bucket.create({name: 'Test Bucket With Description', description: 'Hello, World.'}).then(function(b){
      expect(b.opts.description).toBe("Hello, World.");
      done();
    }).catch(function(e){
      fail("Team not found");
      done();
    });
  });

});
