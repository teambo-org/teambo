describe("t.team.item.js", function() {
    
    it("Creates item", function(done) {
        var bucket_id = Teambo.team.current.bucket_ids[0];
        Teambo.team.item.create(bucket_id, {name: 'New Test Item'}).then(function(item){
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
        Teambo.team.item.update(bucket_id, item_id, {name: 'Test Item'}).then(function(item){
            expect(item.opts.name).toBe("Test Item");
            done();
        }).catch(function(e){
            fail("Item could not be edited");
            done();
        });
    });
    
    it("Deletes item", function(done) {
        var bucket_id = Teambo.team.current.bucket_ids[0];
        Teambo.team.item.create(bucket_id, {name: 'Test Item For Deletion'}).then(function(item){
            Teambo.team.item.remove(bucket_id, item.id).then(function(b){
                expect(Teambo.team.current.buckets[bucket_id].item_ids.length).toBe(1);
                // Item uncaches on delete
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
    
});
