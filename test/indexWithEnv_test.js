var assert = require("assert"),
    vows = require("vows"),
    path = require("path"),
    mustache = require("mustache"),
    experiment = require("./../lib"),
    experiment2 = require("./../lib"),
    errors = require("./../lib/errors"),
    Group = require("./../lib/group"),
    Experiment = require("./../lib/experiment");

vows.describe("experiment").addBatch({
    "configureFromFile": {
        "with a valid file in test env": {
            topic: function () {
                var err;
                
                process.env.TARGET_ENV = 'test';
                try {
                    experiment.configureFromFile(path.resolve(__dirname, "configWithEnvs.json"));
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
            "should create the specified experiments": function (err) {
                assert.ok(Experiment.byName("featureOne"));
                assert.ok(Experiment.byName("featureTwo"));
                assert.ok(Experiment.byName("featureThree"));
                assert.ok(Experiment.byName("featureFour"));
            },

            "feature with always off in test env": {
                topic: function () {
                    var exps = experiment.readFor(experiment.contextFor(50));
                    return experiment.feature("featureFour", exps);
                },
                "should return valid variant": function (variant) {
                    assert.isFalse(!!variant);
                    process.env.TARGET_ENV = undefined;
                }
            }
        }
    }
}).export(module);
