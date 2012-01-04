var assert = require("assert"),
    vows = require("vows"),
    path = require("path"),
    mustache = require("mustache"),
    experiment = require("./../lib"),
    errors = require("./../lib/errors"),
    Group = require("./../lib/group"),
    Experiment = require("./../lib/experiment");

vows.describe("experiment").addBatch({
    "configureFromFile": {
        "with a missing file should throw": function () {
            assert.throws(function () {
                experiment.configureFromFile("./blah.json");
            }, /not exist/);
        },
        "with an invalid file should throw": function () {
            assert.throws(function () {
                experiment.configureFromFile("./badconfig.json");
            }, errors.InvalidConfigurationError );
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
                assert.ok(Experiment.byName("featureOne"));
                assert.ok(Experiment.byName("featureTwo"));
                assert.ok(Experiment.byName("featureThree"));
            },
            "should create the specified variants": function (err) {
                var featureThree = Experiment.byName("featureThree");
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

                            experiment.protect("featureOne", context, function () {
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

                            experiment.protect("featureOne", context, function () {
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

                            experiment.protect("featureThree", context, {
                                "variantOne": function () {
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

                            experiment.protect("featureThree", context, {
                                "variantOne": function () {
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

                            experiment.protect("featureThree/variantOne", context, function () {
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

                            experiment.protect("featureThree/variantOne", context, function () {
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

                            experiment.protect("featureThree/variantOne", context, {
                                "variantOne": function () {
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

                            experiment.protect("featureThree/variantOne", context, {
                                "variantOne": function () {
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

                    var invited = experiment.select("featureThree/variantOne", context, {
                        "variantOne": function () {
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

            "variantFor": {
                "when called with an experiment name and a single function": {
                    "for a user id that is NOT part of the experiment": {
                        topic: function () {
                            var context = experiment.contextFor(11);
                            var data = "no";

                            if( experiment.variantFor("featureOne", context) ) {
                                data = "yes";
                            };

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

                            if( experiment.variantFor("featureOne", context) ) {
                                data = "yes";
                            };

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

                            if( "variantOne" === experiment.variantFor("featureThree", context) ) {
                                data = "yes";
                            };

                            return data;
                        },
                        "should not call the callback": function (data) {
                            assert.equal(data, "no");
                        }
                    },
                    "for a user id that IS part of the experiment/variant": {
                        topic: function () {
                            var context = experiment.contextFor(11);
                            var data = "no";

                            if( "variantOne" === experiment.variantFor("featureThree", context) ) {
                                data = "yes";
                            };

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

                            if( experiment.variantFor("featureThree/variantOne", context) ) {
                                data = "yes";
                            };

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

                            if( experiment.variantFor("featureThree/variantOne", context) ) {
                                data = "yes";
                            };

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

                            if( "variantOne" === experiment.variantFor("featureThree/variantOne", context) ) {
                                data = "yes";
                            };

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

                            if( "variantOne" === experiment.variantFor("featureThree/variantOne", context) ) {
                                data = "yes";
                            };

                            return data;
                        },
                        "should call the callback": function (data) {
                            assert.equal(data, "yes");
                        }
                    }
                }
            }, // variantFor

            "feature": {
                topic: function () {
                    var context = experiment.contextFor(11);

                    return experiment.feature("featureThree", context);
                },
                "should return valid variant": function (variant) {
                    assert.equal(variant, "variantOne");
                },
                "should return truthy value": function (variant) {
                    assert.isTrue(variant ? true : false);
                }
            },// feature

            "feature with no variants": {
                topic: function () {
                    var context = experiment.contextFor(22);

                return experiment.feature("featureOne", context);
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

                    return experiment.feature("featureOne", context);
                },
                "should return valid variant": function (variant) {
                    assert.isFalse(variant);
                }
            },

            "feature with invalid feature": {
                topic: function () {
                    var context = experiment.contextFor(50);

                    return experiment.feature("feature that doesn't exist", context);
                },
                "should return valid variant": function (variant) {
                    assert.isFalse(variant);
                }
            },

            "feature with always on": {
                topic: function () {
                    var context = experiment.contextFor(50);

                    return experiment.feature("featureFour", context);
                },
                "should return valid variant": function (variant) {
                    assert.isTrue(!!variant);
                }
            },

            "feature with always off": {
                topic: function () {
                    var context = experiment.contextFor(50);

                    return experiment.feature("featureFive", context);
                },
                "should return false": function (variant) {
                    assert.isFalse(variant);
                }
            }  
        }
    }
}).export(module);
