var assert = require("assert"),
    vows = require("vows"),
    Variant = require("./../lib/variant");

vows.describe("variant").addBatch({
    "A new Variant": {
        topic: new Variant,
        "should not have "
    }
}).export(module);
