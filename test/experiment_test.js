var assert = require("assert"),
    vows = require("vows"),
    Experiment = require("./../lib/experiment");

vows.describe("experiment").addBatch({
    "A new Experiment": {
        topic: new Experiment,
        "should not have a default id": function (ex) {
            assert.isUndefined(ex.id);
        },
        "should not have a default name": function (ex) {
            assert.isUndefined(ex.name);
        }
    },
    "A new Experiment with a name": {
        topic: new Experiment({name: "Build a better mouse trap!"}),
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
            "and altered and saved again": {
                topic: function (ex) {
                    this.id = ex.id;
                    this.ex = ex;
                    ex.name = "Do something else.";
                    ex.save(this.callback);
                },
                "should succeed": function (err) {
                    assert.ok(!err);
                },
                "should not alter the id": function (err) {
                    assert.ok(this.ex);
                    assert.equal(this.id, this.ex.id);
                }
            }
        }
    }
}).export(module);
