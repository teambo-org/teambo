describe("t.acct.js", function() {
    
    it("Creates buckets", function(done) {
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
