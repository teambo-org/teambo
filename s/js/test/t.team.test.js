describe("Team", function() {

  it("Can be created", function(done) {
    Teambo.team.create("New Test Team").then(function(team){
      expect(Teambo.acct.current.teams.length).toBe(1);
      done();
    }).catch(function(e){
      fail("Team not created");
      done();
    });
  });

  it("Can be found", function(done) {
    var t = Teambo.acct.current.teams[0];
    Teambo.acct.current.team.find(t.id).then(function(team){
      expect(team.opts.name).toBe("New Test Team");
      Teambo.team.current = team;
      done();
    }).catch(function(e){
      fail("Team not found");
      done();
    });
  });

  it("Can be edited", function(done) {
    Teambo.team.current.update({name: "Test Team"}).then(function(team){
      expect(team.opts.name).toBe("Test Team");
      done();
    }).catch(function(e){
      fail("Team not found");
      done();
    });
  });

  it("Can have a theme", function(done) {
    Teambo.team.current.update({theme: "Dark"}).then(function(team){
      expect(team.opts.theme).toBe("Dark");
      done();
    }).catch(function(e){
      fail("Team not found");
      done();
    });
  });

});
