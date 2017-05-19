describe("Item", function() {

  it("Can be created", function(done) {
    Teambo.model.folder.findAll().then(function(folders) {
      folder_id = folders[0].id;
      Teambo.model.item.create({name: 'New Test Item', status: 'ready', description: 'This is a test item', folder_id: folder_id}).then(function(item){
        expect(item.opts.name).toBe("New Test Item");
        done();
      }).catch(function(e){
        fail("Item could not be created");
        done();
      });
    });
  });

  it("Can be edited", function(done) {
    Teambo.model.item.findAll().then(function(items) {
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
    Teambo.model.folder.findAll().then(function(folders) {
      folder_id = folders[0].id;
      Teambo.model.item.create({name: 'Test Item For Deletion', status: 'ready', description: 'This is a test item', folder_id: folder_id}).then(function(item){
        item.remove().then(function(){
          Teambo.model.item.findAll().then(function(items){
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
    Teambo.model.folder.findAll().then(function(folders) {
      folder_id = folders[0].id;
      Teambo.model.item.create({name: 'Test Item For Deletion', status: 'ready', description: 'This is a test item', folder_id: folder_id}).then(function(item){
        var item_id = item.id;
        item.remove().then(function(b){
          Teambo.model.item.findAll().then(function(items) {
            expect(items.length).toBe(1);
            var hash = Teambo.team.current.sha('folder', item_id);
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
    Teambo.model.folder.findAll().then(function(folders) {
      folder_id = folders[0].id;
      Teambo.model.item.create({name: 'In Progress Item', status: 'inprogress', description: 'This is an in progress item', folder_id: folder_id}).then(function(item){
        expect(item.opts.status).toBe("inprogress");
        done();
      }).catch(function(e){
        fail("Item could not be created");
        done();
      });
    });
  });

  it("Can be moved between folders", function(done) {
    Teambo.model.folder.findAll().then(function(folders) {
      folder_id = folders[0].id;
      folder2 = folders[1];
      Teambo.model.item.create({name: 'Moved Item', status: 'ready', description: 'This is a test item for move', folder_id: folder_id}).then(function(item){
        var item_id = item.id;
        item.update({folder_id: folder2.id}).then(function(new_item){
          expect(new_item.opts.folder_id).toBe(folder2.id);
          done();
        }).catch(function(e){
          fail("Item could not be edited");
          done();
        });
      }).catch(function(e){
        fail("Item could not be created");
        done();
      });
    });
  });

});
