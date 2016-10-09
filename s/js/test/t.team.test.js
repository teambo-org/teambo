describe("t.team.js", function() {
    
    it("Creates teams", function(done) {
        Teambo.team.create("Test Team").then(function(team){
            expect(Teambo.acct.current.teams.length).toBe(1);
            done();
        }).catch(function(e){
            fail("Team not created");
            done();
        });
    });
    
    it("Finds teams", function(done) {
        var t = Teambo.acct.current.teams[0];
        Teambo.acct.current.team.find(t.id).then(function(team){
            expect(team.opts.name).toBe("Test Team");
            done();
        }).catch(function(e){
            fail("Team not found");
            done();
        });
    });
    
});
