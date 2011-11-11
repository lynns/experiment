var assert = require("assert"),
    vows = require("vows"),
    Variant = require("./../lib/variant");

vows.describe("variant").addBatch({
    "A new Variant": {
        topic: new Variant,
        "should not have an id": function (va) {
            assert.isUndefined(va.id);
        },
        "should have zero participants": function (va) {
            assert.equal(0, va.participants);
        },
        "should have zero conversions": function (va) {
            assert.equal(0, va.conversions);
        },
        "should not be live": function (va) {
            assert.ok(!va.live);
        },
        "with an experimentId and 10 participants": {
            topic: function (va) {
                va.experimentId = 1;
                for (var i = 0; i < 10; ++i) {
                    va.incrementParticipants();
                }
                return va;
            },
            "should have an experimentId": function (va) {
                assert.ok(va.experimentId);
            },
            "should have 10 participants": function (va) {
                assert.equal(va.participants, 10);
            },
            "should have a 0 conversion rate": function (va) {
                assert.equal(va.conversionRate, 0);
            },
            "should have a 0.00% pretty conversion rate": function (va) {
                assert.equal(va.prettyConversionRate, "0.00%");
            },
            "after 6 conversions": {
                topic: function (va) {
                    for (var i = 0; i < 6; ++i) {
                        va.incrementConversions();
                    }
                    return va;
                },
                "should have 6 conversions": function (va) {
                    assert.equal(va.conversions, 6);
                },
                "should have a 0.6 conversion rate": function (va) {
                    assert.equal(va.conversionRate, 0.6);
                },
                "should have a 60.00% pretty conversion rate": function (va) {
                    assert.equal(va.prettyConversionRate, "60.00%");
                },
                "when saved to the database": {
                    topic: function (va) {
                        var self = this;
                        va.save(function (err) {
                            self.callback(err, va);
                        });
                    },
                    "should succeed": function (err, va) {
                        assert.ok(!err);
                    },
                    "should have 6 conversions": function (err, va) {
                        assert.equal(va.conversions, 6);
                    },
                    "should have a 0.6 conversion rate": function (err, va) {
                        assert.equal(va.conversionRate, 0.6);
                    },
                    "should have a 60.00% pretty conversion rate": function (err, va) {
                        assert.equal(va.prettyConversionRate, "60.00%");
                    }
                }
            }
        }
    }
}).export(module);
