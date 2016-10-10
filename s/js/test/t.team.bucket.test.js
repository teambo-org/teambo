describe("t.team.bucket.js", function() {

    it("Creates bucket", function(done) {
        Teambo.team.bucket.create('New Test Bucket').then(function(b){
            expect(b.opts.name).toBe("New Test Bucket");
            done();
        }).catch(function(e){
            fail("Team not found");
            done();
        });
    });

    it("Edits bucket name", function(done) {
        var bucket_id = Teambo.team.current.bucket_ids[0];
        Teambo.team.bucket.update(bucket_id, {name: 'Test Bucket'}).then(function(b){
            expect(b.opts.name).toBe("Test Bucket");
            done();
        }).catch(function(e){
            fail("Team not found");
            done();
        });
    });

    it("Deletes bucket", function(done) {
        Teambo.team.bucket.create('Bucket to Delete').then(function(b){
            Teambo.team.bucket.remove(b.id).then(function(b){
                expect(Teambo.team.current.bucket_ids.length).toBe(1);
                done();
            }).catch(function(e){
                fail("Team not found");
                done();
            });
        }).catch(function(e){
            fail("Team not found");
            done();
        });
    });

});
