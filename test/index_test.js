var assert = require("assert"),
    vows = require("vows"),
    path = require("path"),
    experiment = require("./../lib"),
    Group = require("./../lib/group"),
    Experiment = require("./../lib/experiment");

vows.describe("experiment").addBatch({
    "configureFromFile": {
        "with an invalid file should throw": function () {
            assert.throws(function () {
                experiment.configureFromFile("./blah.json");
            }, /not exist/);
        },
        "with a valid file": {
            topic: function () {
                var err;

                try {
                    experiment.configureFromFile(path.resolve(__dirname, "config.json"));
                } catch (e) {
                    err = e;
                }

                var self = this;
                process.nextTick(function () {
                    self.callback(err);
                });
            },
            "should succeed": function (err) {
                assert.ok(!err);
            },
            "should create the specified groups": function (err) {
                assert.ok(Group.byName("family search"));
                assert.ok(Group.byName("phase 1"));
                assert.ok(Group.byName("phase 2"));
                assert.ok(Group.byName("phase 3"));
            },
            "should create the specified experiments": function (err) {
                assert.ok(Experiment.byName("feature one"));
                assert.ok(Experiment.byName("feature two"));
                assert.ok(Experiment.byName("feature three"));
            },
            "should create the specified variants": function (err) {
                var featureThree = Experiment.byName("feature three");
                assert.equal(featureThree.variants.length, 2);
            },
            "protect": {
                "for a user id that is not part of the experiment": {
                    topic: function () {
                        var context = experiment.contextFor(11);
                        var data = "no";

                        experiment.protect("feature one", context, function () {
                            data = "yes";
                        });

                        return data;
                    },
                    "should not call the callback": function (data) {
                        assert.equal(data, "no");
                    }
                },
                "for a user id that is part of the experiment": {
                    topic: function () {
                        var context = experiment.contextFor(22);
                        var data = "no";

                        experiment.protect("feature one", context, function () {
                            data = "yes";
                        });

                        return data;
                    },
                    "should call the callback": function (data) {
                        assert.equal(data, "yes");
                    }
                }
            }
        }
    }
}).export(module);
