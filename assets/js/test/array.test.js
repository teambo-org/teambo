describe("array.js", function() {
  it("array remove", function() {
    var a = ['a', 'b', 'c'];
    Teambo.array.remove(a, 'b');
    expect(a.length).toBe(2);
    expect(a[0]).toBe('a');
    expect(a[1]).toBe('c');
  });
  it("array.findByProperty", function() {
    var a = [{a: 1}, {a: 2}, {a: 3}, {a: 4, b: 5}];
    var b = Teambo.array.findByProperty(a, 'a', 3);
    expect(b.a).toBe(3);
    var b = Teambo.array.findByProperty(a, 'a', 4);
    expect(b.b).toBe(5);
  });
  it("array.deleteByProperty", function() {
    var a = [{a: 1}, {a: 2}, {a: 3}, {a: 4, b: 5}];
    Teambo.array.deleteByProperty(a, 'a', 3);
    expect(a.length).toBe(3);
    Teambo.array.deleteByProperty(a, 'a', 4);
    expect(a.length).toBe(2);
  });
});
