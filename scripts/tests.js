(function() {
  var callbackGroup;

  callbackGroup = function() {
    var group;
    group = {};
    group.reset = function() {
      var key, value, _results;
      _results = [];
      for (key in group) {
        value = group[key];
        if (Object.prototype.toString.call(value.reset) === "[object Function]") {
          _results.push(value.reset());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };
    return group;
  };

  module("Finch", {
    teardown: function() {
      return Finch.reset();
    }
  });

  test("Simple routing", sinon.test(function() {
    var baz_quux, foo_bar;
    foo_bar = this.stub();
    baz_quux = this.stub();
    Finch.route("foo/bar", foo_bar);
    Finch.route("baz/quux", baz_quux);
    Finch.call("/foo/bar");
    ok(foo_bar.called, "foo/bar called");
    Finch.call("/baz/quux");
    return ok(baz_quux.called, "baz/quux called");
  }));

  test("Simple hierarchical routing", sinon.test(function() {
    var foo, foo_bar, foo_bar_id, foo_baz, foo_baz_id, quux, quux_id;
    Finch.route("foo", foo = this.stub());
    Finch.route("[foo]/bar", foo_bar = this.stub());
    Finch.route("[foo/bar]/:id", foo_bar_id = this.stub());
    Finch.route("[foo]/baz", foo_baz = this.stub());
    Finch.route("[foo/baz]/:id", foo_baz_id = this.stub());
    Finch.route("quux", quux = this.stub());
    Finch.route("[quux]/:id", quux_id = this.stub());
    Finch.call("/foo/bar");
    ok(foo.calledOnce, "foo called");
    ok(foo_bar.calledOnce, "foo/bar called");
    ok(foo.calledBefore(foo_bar), "foo called before foo/bar");
    foo.reset();
    foo_bar.reset();
    Finch.call("/foo/bar/123");
    ok(!foo.called, "foo not called again");
    ok(!foo_bar.called, "foo/bar not called again");
    ok(foo_bar_id.calledOnce, "foo/bar/id called");
    deepEqual(foo_bar_id.getCall(0).args[0], {
      id: "123"
    }, "foo/bar/id params");
    foo_bar_id.reset();
    Finch.call("/foo/bar/123?x=Hello&y=World");
    ok(!foo.called, "foo not called again");
    ok(!foo_bar.called, "foo/bar not called again");
    ok(foo_bar_id.calledOnce, "foo/bar/id called");
    deepEqual(foo_bar_id.getCall(0).args[0], {
      x: "Hello",
      y: "World",
      id: "123"
    }, "foo/bar/id params");
    foo_bar_id.reset();
    Finch.call("/foo/baz/456");
    ok(!foo.called, "foo not called again");
    ok(foo_baz.called, "foo/baz called");
    ok(foo_baz_id.called, "foo/baz/id called");
    ok(foo_baz.calledBefore(foo_baz_id), "foo/baz called before foo/baz/id");
    deepEqual(foo_baz_id.getCall(0).args[0], {
      id: "456"
    }, "foo/baz/id params");
    foo_baz.reset();
    foo_baz_id.reset();
    Finch.call("/quux/789?band=Sunn O)))&genre=Post-Progressive Fridgecore");
    ok(quux.called, "quux called");
    ok(quux_id.called, "quux/id called");
    ok(quux.calledBefore(quux_id), "quux called before quux/id");
    return deepEqual(quux_id.getCall(0).args[0], {
      band: "Sunn O)))",
      genre: "Post-Progressive Fridgecore",
      id: "789"
    }, "quux/id params");
  }));

  test("More hierarchical routing", sinon.test(function() {
    var foo, foo_bar, foo_bar_baz, foo_bar_quux;
    Finch.route("foo", foo = this.stub());
    Finch.route("[foo]/bar/baz", foo_bar_baz = this.stub());
    Finch.route("foo/bar", foo_bar = this.stub());
    Finch.route("[foo/bar]/quux", foo_bar_quux = this.stub());
    Finch.call("/foo/bar/baz");
    ok(foo.called, "foo called");
    ok(foo_bar_baz.called, "foo/bar/baz called");
    ok(foo.calledBefore(foo_bar_baz), "foo called before foo/bar/baz");
    ok(!foo_bar.called, "foo/bar NOT called");
    foo.reset();
    foo_bar_baz.reset();
    Finch.call("/foo/bar/quux");
    ok(foo_bar.called, "foo/bar called");
    ok(foo_bar_quux.called, "foo/bar/quux called");
    ok(foo_bar.calledBefore(foo_bar_quux), "foo/bar called before foo/bar/quux");
    return ok(!foo.called, "foo NOT called");
  }));

  test("Empty string params", sinon.test(function() {
    var quux, quux_id;
    Finch.route("quux", quux = this.stub());
    Finch.route("[quux]/:id", quux_id = this.stub());
    Finch.call("/quux/123?x=&y=");
    ok(quux.called, "quux called");
    ok(quux_id.called, "quux/id called");
    ok(quux.calledBefore(quux_id), "quux called before quux/id");
    return deepEqual(quux_id.getCall(0).args[0], {
      x: "",
      y: "",
      id: "123"
    }, "quux params");
  }));

  test("Collision between inlined and query string params", sinon.test(function() {
    var foo_bar_baz;
    Finch.route("foo/:bar/:baz", foo_bar_baz = this.stub());
    Finch.call("foo/abc/def?bar=123&baz=456&quux=789");
    ok(foo_bar_baz.called, "foo/bar/baz called");
    return deepEqual(foo_bar_baz.getCall(0).args[0], {
      bar: "abc",
      baz: "def",
      quux: "789"
    }, "foo/bar/baz params");
  }));

  test("Routing with setup/teardown", sinon.test(function() {
    var cb;
    cb = callbackGroup();
    Finch.route("foo", {
      setup: cb.setup_foo = this.stub(),
      load: cb.load_foo = this.stub(),
      teardown: cb.teardown_foo = this.stub()
    });
    Finch.route("[foo]/bar", {
      setup: cb.setup_foo_bar = this.stub(),
      load: cb.load_foo_bar = this.stub(),
      teardown: cb.teardown_foo_bar = this.stub()
    });
    Finch.route("[foo/bar]/:id", {
      setup: cb.setup_foo_bar_id = this.stub(),
      load: cb.load_foo_bar_id = this.stub(),
      teardown: cb.teardown_foo_bar_id = this.stub()
    });
    Finch.route("[foo]/baz", {
      setup: cb.setup_foo_baz = this.stub(),
      teardown: cb.teardown_foo_baz = this.stub()
    });
    Finch.route("[foo/baz]/:id", {
      setup: cb.setup_foo_baz_id = this.stub(),
      teardown: cb.teardown_foo_baz_id = this.stub()
    });
    Finch.call("/foo");
    ok(cb.setup_foo.called, "/foo: foo setup");
    ok(cb.load_foo.called, "/foo: foo load");
    cb.reset();
    Finch.call("/foo/bar");
    ok(!cb.setup_foo.called, "/foo/bar: no foo setup");
    ok(!cb.load_foo.called, "/foo/bar: no foo load");
    ok(!cb.teardown_foo.called, "/foo/bar: no foo teardown");
    ok(cb.setup_foo_bar.called, "/foo/bar: foo/bar setup");
    ok(cb.load_foo_bar.called, "/foo/bar: foo/bar load");
    cb.reset();
    Finch.call("/foo");
    ok(cb.teardown_foo_bar.called, "/foo: foo/bar teardown");
    ok(!cb.setup_foo.called, "/foo: no foo setup");
    ok(cb.load_foo.called, "/foo: foo load");
    cb.reset();
    Finch.call("/foo/bar/123?x=abc");
    ok(!cb.teardown_foo.called, "/foo/bar/123: no foo teardown");
    ok(!cb.setup_foo.called, "/foo/bar/123: no foo setup");
    ok(cb.setup_foo_bar.called, "/foo/bar/123: foo/bar setup");
    ok(cb.setup_foo_bar_id.called, "/foo/bar/123: foo/bar/id setup");
    ok(!cb.load_foo.called, "/foo/bar/123: no foo load");
    ok(!cb.load_foo_bar.called, "/foo/bar/123: no foo/bar load");
    ok(cb.load_foo_bar_id.called, "/foo/bar/123: foo/bar/id load");
    cb.reset();
    Finch.call("/foo/bar/456?x=abc");
    ok(cb.teardown_foo_bar_id.called, "/foo/bar/456?x=abc: foo/bar/id teardown");
    ok(cb.setup_foo_bar_id.called, "/foo/bar/456?x=abc: foo/bar/id setup");
    ok(cb.load_foo_bar_id.called, "/foo/bar/456?x=abc: foo/bar/id load");
    cb.reset();
    Finch.call("/foo/bar/456?x=def");
    ok(!cb.setup_foo_bar_id.called, "/foo/bar/456?x=def: no foo/bar/id setup");
    ok(cb.load_foo_bar_id.called, "/foo/bar/456?x=def: foo/bar/id load");
    cb.reset();
    Finch.call("/foo/baz/789");
    ok(cb.teardown_foo_bar_id.called, "/foo/baz/789: foo/baz/id teardown");
    ok(cb.teardown_foo_bar.called, "/foo/baz/789: foo/bar teardown");
    ok(!cb.teardown_foo.called, "/foo/baz/789: no foo teardown");
    ok(!cb.setup_foo.called, "/foo/baz/789: no foo setup");
    ok(cb.setup_foo_baz.calledOnce, "/foo/baz/789: foo/baz setup");
    ok(cb.setup_foo_baz_id.calledOnce, "/foo/baz/789: foo/baz/id setup");
    ok(!cb.load_foo.called, "/foo/baz/789: no foo load");
    cb.reset();
    Finch.call("/foo/baz/abc?term=Hello");
    ok(cb.teardown_foo_baz_id.called, "/foo/baz/abc?term=Hello: foo/baz/id teardown");
    ok(cb.setup_foo_baz_id.called, "/foo/baz/abc?term=Hello: foo/baz/id setup");
    cb.reset();
    Finch.call("/foo/baz/abc?term=World");
    ok(!cb.teardown_foo_baz_id.called, "/foo/baz/abc?term=World: no foo/baz/id teardown");
    return ok(!cb.setup_foo_baz_id.called, "/foo/baz/abc?term=World: no foo/baz/id setup");
  }));

}).call(this);