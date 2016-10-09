describe("t.acct.js", function() {
    
    var email = "test@test.test";
    var pass = Teambo.crypto.randomKey();
    
    it("creates verified accounts", function(done) {
        var bypass = true;
        Teambo.acct.verification.send(email, pass, bypass).then(function(){
            expect(Teambo.acct.current).not.toBe(null);
            done();
        });
    });
    
});
