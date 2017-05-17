describe("Folder", function() {

  it("Can be created", function(done) {
    Teambo.model.folder.create({name: 'New Test Folder'}).then(function(b){
      expect(b.opts.name).toBe("New Test Folder");
      done();
    }).catch(function(e){
      fail("Team not found");
      done();
    });
  });

  it("Can be edited", function(done) {
    Teambo.model.folder.findAll().then(function(folders) {
      var folder = folders[0];
      folder.update({name: 'Test Folder'}).then(function(b){
        expect(b.opts.name).toBe("Test Folder");
        done();
      }).catch(function(e){
        fail("Team not found");
        done();
      });
    });
  });

  it("Can be deleted", function(done) {
    Teambo.model.folder.create({name: 'Folder to Delete'}).then(function(b){
      b.remove().then(function(){
        Teambo.model.folder.findAll().then(function(folders) {
          expect(folders.length).toBe(1);
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
    Teambo.model.folder.create({name: 'Test Folder With Description', description: 'Hello, World.'}).then(function(b){
      expect(b.opts.description).toBe("Hello, World.");
      done();
    }).catch(function(e){
      fail("Team not found");
      done();
    });
  });

  it("Cannot have undefined properties", function(done) {
    Teambo.model.folder.create({name: 'Test Folder without undefined properties', description: 'Hello, World.', asdf: 'asdasdfasdfasdfasdf'}).then(function(b){
      expect(b.opts.asdf).toBe(undefined);
      done();
    }).catch(function(e){
      fail("Model could not be saved");
      done();
    });
  });

});
