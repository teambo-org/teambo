describe("t.acct.js", function() {
    
    var email = "test@test.test";
    var pass = Teambo.crypto.randomKey();
    
    Teambo.acct.deAuth();
    
    it("Creates verified accounts", function(done) {
        var bypass = true;
        Teambo.acct.verification.send(email, pass, bypass).then(function(){
            expect(Teambo.acct.current).not.toBe(null);
            done();
        }).catch(function(e){
            fail("Account not created");
        });
    });
    
    it("Deauths", function() {
        Teambo.acct.deAuth();
        expect(Teambo.acct.current).toBe(null);
    });
    
    it("Auths", function(done) {
        Teambo.acct.auth(email, pass).then(function(){
            expect(Teambo.acct.current).not.toBe(null);
            done();
        });
    });
    
});
