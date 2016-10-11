describe("t.team.item.js", function() {

    it("Creates item", function(done) {
        var bucket_id = Teambo.team.current.bucket_ids[0];
        Teambo.team.item.create(bucket_id, {name: 'New Test Item', status: 'ready', description: 'This is a test item'}).then(function(item){
            expect(item.opts.name).toBe("New Test Item");
            done();
        }).catch(function(e){
            fail("Item could not be created");
            done();
        });
    });

    it("Edits item name", function(done) {
        var bucket_id = Teambo.team.current.bucket_ids[0];
        var item_id   = Teambo.team.current.buckets[bucket_id].item_ids[0];
        Teambo.team.item.update(bucket_id, item_id, {name: 'Test Item', status: 'ready', description: 'This is a test item'}).then(function(item){
            expect(item.opts.name).toBe("Test Item");
            done();
        }).catch(function(e){
            fail("Item could not be edited");
            done();
        });
    });

    it("Deletes item", function(done) {
        var bucket_id = Teambo.team.current.bucket_ids[0];
        Teambo.team.item.create(bucket_id, {name: 'Test Item For Deletion', status: 'ready', description: 'This is a test item'}).then(function(item){
            Teambo.team.item.remove(bucket_id, item.id).then(function(b){
                expect(Teambo.team.current.buckets[bucket_id].item_ids.length).toBe(1);
                done();
            }).catch(function(e){
                fail("Item could not be deleted");
                done();
            });
        }).catch(function(e){
            fail("Item could not be created");
            done();
        });
    });

    it("Removes item from cache upon deletion", function(done) {
        var bucket_id = Teambo.team.current.bucket_ids[0];
        Teambo.team.item.create(bucket_id, {name: 'Test Item For Deletion', status: 'ready', description: 'This is a test item'}).then(function(item){
            Teambo.team.item.remove(bucket_id, item.id).then(function(b){
                expect(Teambo.team.current.buckets[bucket_id].item_ids.length).toBe(1);
                var hash = Teambo.crypto.sha(Teambo.team.current.id+bucket_id+item.id+Teambo.salt);
                localforage.getItem(hash).then(function(val){
                    expect(val).toBe(null);
                    done();
                });
            }).catch(function(e){
                fail("Item could not be deleted");
                done();
            });
        }).catch(function(e){
            fail("Item could not be created");
            done();
        });
    });

    it("Creates item with status", function(done) {
        var bucket_id = Teambo.team.current.bucket_ids[0];
        Teambo.team.item.create(bucket_id, {name: 'In Progress Item', status: 'inprogress', description: 'This is an in progress item'}).then(function(item){
            expect(item.opts.status).toBe("inprogress");
            done();
        }).catch(function(e){
            fail("Item could not be created");
            done();
        });
    });

});
