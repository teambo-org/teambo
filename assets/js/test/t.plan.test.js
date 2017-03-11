describe("Plan", function() {

  it("Can be created", function(done) {
    Teambo.model.plan.create({name: 'New Test Plan'}).then(function(p){
      expect(p.opts.name).toBe("New Test Plan");
      done();
    }).catch(function(e){
      fail("Plan could not be created");
      done();
    });
  });

  it("Can be edited", function(done) {
    Teambo.model.plan.findAll().then(function(plans) {
      var plan = plans[0];
      plan.update({name: 'Test Plan'}).then(function(p){
        expect(p.opts.name).toBe("Test Plan");
        done();
      }).catch(function(e){
        fail("Plan could not be edited");
        done();
      });
    });
  });

  it("Can be deleted", function(done) {
    Teambo.model.plan.create({name: 'Plan to Delete'}).then(function(p){
      p.remove().then(function(){
        Teambo.model.plan.findAll().then(function(plans) {
          expect(plans.length).toBe(1);
          done();
        });
      }).catch(function(e){
        fail("Plan could not be removed");
        done();
      });
    }).catch(function(e){
      fail("Plan could not be created");
      done();
    });
  });

  it("Can have description", function(done) {
    Teambo.model.plan.create({name: 'Test Plan With Description', desc: 'Hello, World.'}).then(function(p){
      expect(p.opts.desc).toBe("Hello, World.");
      done();
    }).catch(function(e){
      fail("Plan could not be created");
      done();
    });
  });

  it("Cannot have undefined properties", function(done) {
    Teambo.model.plan.create({name: 'Test Plan without undefined properties', desc: 'Hello, World.', asdf: 'asdasdfasdfasdfasdf'}).then(function(p){
      expect(p.opts.asdf).toBe(undefined);
      done();
    }).catch(function(e){
      fail("Model could not be saved");
      done();
    });
  });

  it("Can have items", function(done) {
    var item = Teambo.model.item.all[0];
    var plan = Teambo.model.plan.all[0];
    item.update({plan_id: plan.id}).then(function(new_item){
      expect(plan.item_count()).toBe(1);
      done();
    }).catch(function(e){
      fail("Item could not be edited");
      done();
    });
  });

});
