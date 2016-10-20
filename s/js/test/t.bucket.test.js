describe("t.bucket.js", function() {

    it("Creates bucket", function(done) {
        Teambo.bucket.create('New Test Bucket').then(function(b){
            expect(b.opts.name).toBe("New Test Bucket");
            done();
        }).catch(function(e){
            fail("Team not found");
            done();
        });
    });

    it("Edits bucket name", function(done) {
        Teambo.bucket.findAll().then(function(buckets) {
            bucket_id = buckets[0].id;
            Teambo.bucket.update(bucket_id, {name: 'Test Bucket'}).then(function(b){
                expect(b.opts.name).toBe("Test Bucket");
                done();
            }).catch(function(e){
                fail("Team not found");
                done();
            });
        });
    });

    it("Deletes bucket", function(done) {
        Teambo.bucket.create('Bucket to Delete').then(function(b){
            Teambo.bucket.remove(b.id).then(function(b){
                Teambo.bucket.findAll().then(function(buckets) {
                    expect(buckets.length).toBe(1);
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

});
