describe("Item", function() {

  it("Can be created", function(done) {
    Teambo.bucket.findAll().then(function(buckets) {
      bucket_id = buckets[0].id;
      Teambo.item.create({name: 'New Test Item', status: 'ready', description: 'This is a test item', bucket_id: bucket_id}).then(function(item){
        expect(item.opts.name).toBe("New Test Item");
        done();
      }).catch(function(e){
        fail("Item could not be created");
        done();
      });
    });
  });

  it("Can be edited", function(done) {
    Teambo.item.findAll().then(function(items) {
      item = items[0];
      item.update({name: 'Test Item'}).then(function(new_item){
        expect(new_item.opts.name).toBe("Test Item");
        done();
      }).catch(function(e){
        fail("Item could not be edited");
        done();
      });
    });
  });

  it("Can be deleted", function(done) {
    Teambo.bucket.findAll().then(function(buckets) {
      bucket_id = buckets[0].id;
      Teambo.item.create({name: 'Test Item For Deletion', status: 'ready', description: 'This is a test item', bucket_id: bucket_id}).then(function(item){
        item.remove().then(function(){
          Teambo.item.findAll().then(function(items){
            expect(items.length).toBe(1);
            done();
          });
        }).catch(function(e){
          fail("Item could not be deleted");
          done();
        });
      }).catch(function(e){
        fail("Item could not be created");
        done();
      });
    });
  });

  it("Is removed from cache upon deletion", function(done) {
    Teambo.bucket.findAll().then(function(buckets) {
      bucket_id = buckets[0].id;
      Teambo.item.create({name: 'Test Item For Deletion', status: 'ready', description: 'This is a test item', bucket_id: bucket_id}).then(function(item){
        var item_id = item.id;
        item.remove().then(function(b){
          Teambo.item.findAll().then(function(items) {
            expect(items.length).toBe(1);
            var hash = Teambo.crypto.sha(Teambo.team.current.id+item_id+Teambo.salt);
            localforage.getItem(hash).then(function(val){
              expect(val).toBe(null);
              done();
            });
          });
        }).catch(function(e){
          fail("Item could not be deleted");
          done();
        });
      }).catch(function(e){
        fail("Item could not be created");
        done();
      });
    });
  });

  it("Can have a status", function(done) {
    Teambo.bucket.findAll().then(function(buckets) {
      bucket_id = buckets[0].id;
      Teambo.item.create({name: 'In Progress Item', status: 'inprogress', description: 'This is an in progress item', bucket_id: bucket_id}).then(function(item){
        expect(item.opts.status).toBe("inprogress");
        done();
      }).catch(function(e){
        fail("Item could not be created");
        done();
      });
    });
  });

});
