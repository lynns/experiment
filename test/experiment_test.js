var assert = require("assert"),
    vows = require("vows"),
    Experiment = require("./../lib/experiment"),
    Variant = require("./../lib/variant");

var guid = 1;

function uniqueExperimentName() {
    return "Experiment " + guid++;
}

vows.describe("experiment").addBatch({
    "A new Experiment": {
        topic: new Experiment,
        "should not have an id": function (ex) {
            assert.isUndefined(ex.id);
        },
        "should not have a name": function (ex) {
            assert.isUndefined(ex.name);
        },
        "should not be live": function (ex) {
            assert.ok(!ex.live);
        }
    },
    "A new Experiment with a name": {
        topic: new Experiment({name: uniqueExperimentName()}),
        "should not have an id": function (ex) {
            assert.isUndefined(ex.id);
        },
        "should have a name": function (ex) {
            assert.ok(ex.name);
        },
        "should not be live": function (ex) {
            assert.ok(!ex.live);
        },
        "when saved": {
            topic: function (ex) {
                this.ex = ex;
                ex.save(this.callback);
            },
            "should succeed": function (err) {
                assert.ok(!err);
            },
            "should update the experiment with an id": function (err) {
                assert.ok(this.ex);
                assert.ok(this.ex.id);
            },
            "with two variants": {
                topic: function (ex) {
                    var self = this, n = 2, c = 0;

                    function tryCallback() {
                        c += 1;
                        if (c == n) {
                            ex.variants(self.callback);
                        }
                    }

                    for (var i = 0; i < n; ++i) {
                        this["va" + i] = new Variant({experimentId: ex.id});
                        this["va" + i].save(function (err) {
                            tryCallback();
                        });
                    }
                },
                "should succeed": function (err, variants) {
                    assert.ok(!err);
                },
                "should have two variants": function (err, variants) {
                    assert.ok(variants);
                    assert.equal(2, variants.length);
                }
            },
            "and saved again": {
                topic: function (ex) {
                    this.id = ex.id;
                    var self = this;
                    ex.save(function (err) {
                        self.callback(err, ex);
                    });
                },
                "should succeed": function (err, ex) {
                    assert.ok(!err);
                },
                "should not alter the id": function (err, ex) {
                    assert.ok(ex);
                    assert.equal(this.id, ex.id);
                },
                "and fetched fresh from the database": {
                    topic: function (err, ex) {
                        this.id = ex.id;
                        this.name = ex.name;
                        this.live = ex.live;
                        Experiment.find(ex.id, this.callback);
                    },
                    "should succeed": function (err, ex) {
                        assert.ok(!err);
                    },
                    "should set the correct attributes": function (err, ex) {
                        assert.ok(ex);
                        assert.strictEqual(ex.live, this.live);
                        assert.strictEqual(ex.name, this.name);
                    }
                }
            }
        }
    }
}).export(module);
