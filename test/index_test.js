var assert = require("assert"),
    vows = require("vows"),
    path = require("path"),
    mustache = require("mustache"),
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
                "when called with an unknown experiment name": {
                    topic: function () {
                        var context = experiment.contextFor(11);
                        var data = "no";

                        this.log = "";
                        var self = this;
                        experiment.log = function (message) {
                            self.log += message;
                        }

                        experiment.protect("non-existent feature", context, function () {
                            data = "yes";
                        });

                        return data;
                    },
                    "should not call the callback": function (data) {
                        assert.equal(data, "no");
                    },
                    "should write a message to the log": function (data) {
                        assert.match(this.log, /undefined/i);
                    }
                },

                "when called with an experiment name and a single function": {
                    "for a user id that is NOT part of the experiment": {
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
                    "for a user id that IS part of the experiment": {
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
                },

                "when called with an experiment name and an object of variant name/function pairs": {
                    "for a user id that is NOT part of the experiment/variant": {
                        topic: function () {
                            var context = experiment.contextFor(22);
                            var data = "no";

                            experiment.protect("feature three", context, {
                                "variant one": function () {
                                    data = "yes";
                                },
                                "fallback": function () {
                                    data = "fallback";
                                }
                            });

                            return data;
                        },
                        "should call the fallback": function (data) {
                            assert.equal(data, "fallback");
                        }
                    },
                    "for a user id that IS part of the experiment/variant": {
                        topic: function () {
                            var context = experiment.contextFor(11);
                            var data = "no";

                            experiment.protect("feature three", context, {
                                "variant one": function () {
                                    data = "yes";
                                },
                                "fallback": function () {
                                    data = "fallback";
                                }
                            });

                            return data;
                        },
                        "should call the callback": function (data) {
                            assert.equal(data, "yes");
                        }
                    }
                },

                "when called with an experiment name/variant name and a single function": {
                    "for a user id that is NOT part of the experiment": {
                        topic: function () {
                            var context = experiment.contextFor(22);
                            var data = "no";

                            experiment.protect("feature three/variant one", context, function () {
                                data = "yes";
                            });

                            return data;
                        },
                        "should not call the callback": function (data) {
                            assert.equal(data, "no");
                        }
                    },
                    "for a user id that IS part of the experiment": {
                        topic: function () {
                            var context = experiment.contextFor(11);
                            var data = "no";

                            experiment.protect("feature three/variant one", context, function () {
                                data = "yes";
                            });

                            return data;
                        },
                        "should call the callback": function (data) {
                            assert.equal(data, "yes");
                        }
                    }
                },

                // This is not the intended use case, but should still work
                // as the user intends it to -- that is, the variant name in
                // the experiment/variant pair must match the name of the
                // variant that is matched.
                "when called with an experiment name/variant name and an object of variant name/function pairs": {
                    "for a user id that is NOT part of the experiment": {
                        topic: function () {
                            var context = experiment.contextFor(22);
                            var data = "no";

                            experiment.protect("feature three/variant one", context, {
                                "variant one": function () {
                                    data = "yes";
                                },
                                "fallback": function () {
                                    data = "fallback";
                                }
                            });

                            return data;
                        },
                        "should call the fallback": function (data) {
                            assert.equal(data, "fallback");
                        }
                    },
                    "for a user id that IS part of the experiment": {
                        topic: function () {
                            var context = experiment.contextFor(11);
                            var data = "no";

                            experiment.protect("feature three/variant one", context, {
                                "variant one": function () {
                                    data = "yes";
                                },
                                "fallback": function () {
                                    data = "fallback";
                                }
                            });

                            return data;
                        },
                        "should call the callback": function (data) {
                            assert.equal(data, "yes");
                        }
                    }
                }
            }, // protect

            "select with a mustache template": {
                topic: function () {
                    var context = experiment.contextFor(11);

                    var invited = experiment.select("feature three/variant one", context, {
                        "variant one": function () {
                            return function (text, render) {
                                return render(text, this);
                            };
                        }
                    });

                    var view = {
                        name: "Michael",
                        invited: invited
                    };

                    var template = "" +
                        "<p>" +
                        "There's a New Year's Eve party at my house. " +
                        "{{#invited}}" +
                        "<strong>And you're invited, {{name}}!</strong>" +
                        "{{/invited}}" +
                        "{{^invited}}" +
                        "<em>But you're not invited!</em>" +
                        "{{/invited}}" +
                        "</p>";

                    return mustache.to_html(template, view);
                },
                "should render the template properly": function (text) {
                    assert.equal(text, "<p>There's a New Year's Eve party at my house. <strong>And you're invited, Michael!</strong></p>");
                }
            }, // select

            "feature": {
                topic: function () {
                    var context = experiment.contextFor(11);

                    return experiment.feature("feature three", context);
                },
                "should return valid variant": function (variant) {
                    assert.equal(variant, "variant one");
                },
                "should return truthy value": function (variant) {
                    assert.isTrue(variant ? true : false);
                }
            },// feature

            "feature with no variants": {
                topic: function () {
                    var context = experiment.contextFor(22);

                    return experiment.feature("feature one", context);
                },
                "should return valid variant": function (variant) {
                    assert.equal(variant, "default");
                },
                "should return truthy value": function (variant) {
                    assert.isTrue(variant ? true : false);
                }
            },// feature

            "feature with no matching variant": {
                topic: function () {
                    var context = experiment.contextFor(50);

                    return experiment.feature("feature one", context);
                },
                "should return valid variant": function (variant) {
                    assert.isFalse(variant);
                }
            }, // feature with no matching variant

            "feature with invalid feature": {
                topic: function () {
                    var context = experiment.contextFor(50);

                    return experiment.feature("feature that doesn't exist", context);
                },
                "should return valid variant": function (variant) {
                    assert.isFalse(variant);
                }
            } // feature with invalid feature
        }
    }
}).export(module);
