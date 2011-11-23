var assert = require("assert"),
    vows = require("vows"),
    Experiment = require("./../lib/experiment");

var guid = 1;

function uniqueExperimentName() {
    return "Experiment " + guid++;
}

vows.describe("experiment").addBatch({
    "A new Experiment": {
        topic: new Experiment(uniqueExperimentName()),
        "should have a name": function (experiment) {
            assert.ok(experiment.name);
        },
        "should have no variants": function (experiment) {
            assert.equal(experiment.variants.length, 0);
        }
    }
}).export(module);
