describe("Object", function() {
  it("Can be extended", function() {
    var a = {a: 1, b: 2};
    var b = {b: 3, c: 4};
    var c = Teambo.object.extend(a, b);
    expect(c.a).toBe(1);
    expect(c.b).toBe(3);
    expect(c.c).toBe(4);
  });
  // object.watchable
  // object.clone
});
