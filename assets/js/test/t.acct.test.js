describe("Account", function() {

  var email = "test@test.test";
  var pass = Teambo.crypto.randomKey();

  Teambo.app.online(true);

  console.log(pass);

  Teambo.app.gotoUrl("");
  Teambo.acct.deAuth();

  it("Can be created", function(done) {
    Teambo.acct.verification.send(email, pass, {bypass: true}).then(function(){
      expect(Teambo.acct.current).not.toBe(null);
      done();
    }).catch(function(e){
      fail("Account not created");
    });
  });

  it("Can be deauthenticated", function() {
    Teambo.acct.deAuth();
    expect(Teambo.acct.current).toBe(null);
  });

  it("Can be authenticated", function(done) {
    Teambo.acct.auth(email, pass).then(function(){
      expect(Teambo.acct.current).not.toBe(null);
      done();
    });
  });

});
