describe("t.js", function() {
  it("extend", function() {
    var a = {a: 1, b: 2};
    var b = {b: 3, c: 4};
    var c = Teambo.extend(a, b);
    expect(c.a).toBe(1);
    expect(c.b).toBe(3);
    expect(c.c).toBe(4);
  });
  it("array remove", function() {
    var a = ['a', 'b', 'c'];
    Teambo.array.remove(a, 'b');
    expect(a.length).toBe(2);
    expect(a[0]).toBe('a');
    expect(a[1]).toBe('c');
  });
  it("findByProperty", function() {
    var a = [{a: 1}, {a: 2}, {a: 3}, {a: 4, b: 5}];
    var b = Teambo.findByProperty(a, 'a', 3);
    expect(b.a).toBe(3);
    var b = Teambo.findByProperty(a, 'a', 4);
    expect(b.b).toBe(5);
  });
  it("deleteByProperty", function() {
    var a = [{a: 1}, {a: 2}, {a: 3}, {a: 4, b: 5}];
    Teambo.deleteByProperty(a, 'a', 3);
    expect(a.length).toBe(3);
    Teambo.deleteByProperty(a, 'a', 4);
    expect(a.length).toBe(2);
  });
});
