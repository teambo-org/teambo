describe("t.schema.js", function() {
  it("constrains by type", function() {
    var s = new Teambo.schema({
      name: { type: 'string' }
    });
    var errs = s.validate({name: "dave"});
    expect(errs.length).toBe(0);
    var errs = s.validate({name: 123});
    expect(errs.length).toBe(1);
    var s = new Teambo.schema({
      comments: { type: 'number' }
    });
    var errs = s.validate({comments: 123});
    expect(errs.length).toBe(0);
    var errs = s.validate({comments: {dave: 1}});
    expect(errs.length).toBe(1);
    var errs = s.validate({comments: "dave"});
    expect(errs.length).toBe(1);
    var s = new Teambo.schema({
      comments: { type: 'array' }
    });
    var errs = s.validate({comments: ["dave"]});
    expect(errs.length).toBe(0);
    var errs = s.validate({comments: {dave: 1}});
    expect(errs.length).toBe(1);
    var errs = s.validate({comments: "dave"});
    expect(errs.length).toBe(1);
  });
  it("constrains by required", function() {
    var s = new Teambo.schema({
      name: { required: true }
    });
    var errs = s.validate({name: "dave"});
    expect(errs.length).toBe(0);
    var errs = s.validate({name: null});
    expect(errs.length).toBe(1);
  });
  xit("constrains numbers by required", function() {
    var s = new Teambo.schema({
      size: { type: 'number', required: true }
    });
    var errs = s.validate({size: 0});
    expect(errs.length).toBe(0);
  });
  xit("constrains by required for missing parameters", function() {
    var s = new Teambo.schema({
      size: { type: 'number', required: true }
    });
    var errs = s.validate({});
    expect(errs.length).toBe(1);
  });
  it("constrains by minLength", function() {
    var s = new Teambo.schema({
      name: { minLength: 3 }
    });
    var errs = s.validate({name: "dave"});
    expect(errs.length).toBe(0);
    var errs = s.validate({name: "a"});
    expect(errs.length).toBe(1);
    var errs = s.validate({name: ["a", "b", "c", "d"]});
    expect(errs.length).toBe(0);
    var errs = s.validate({name: ["a", "b"]});
    expect(errs.length).toBe(1);
    var errs = s.validate({name: 123});
    expect(errs.length).toBe(1);
    var s = new Teambo.schema({
      name: { minLength: 3, required: false }
    });
    var errs = s.validate({name: ''});
    expect(errs.length).toBe(0);
  });
  it("constrains by maxLength", function() {
    var s = new Teambo.schema({
      name: { maxLength: 3 }
    });
    var errs = s.validate({name: "da"});
    expect(errs.length).toBe(0);
    var errs = s.validate({name: "dave"});
    expect(errs.length).toBe(1);
    var errs = s.validate({name: ["a", "b", "c", "d"]});
    expect(errs.length).toBe(1);
    var errs = s.validate({name: ["a", "b"]});
    expect(errs.length).toBe(0);
    var errs = s.validate({name: 123});
    expect(errs.length).toBe(1);
  });
});
