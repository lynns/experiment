var assert = require("assert"),
    vows = require("vows"),
    path = require("path"),
    ejs = require("ejs"),
    experiment = require("./../lib");

experiment.configure({
    experiments: {
        "buttonColor": {
            "redButton": "0-10%",
            "greenButton": "11-20%"
        }
    }
});

vows.describe("ejs").addBatch({
    "An ejs template ": {
        topic: function() {
            var renderTemplate = function(template) {
                var withUser = function(user) {
                    var exps = experiment.readFor(experiment.contextFor(user));
                     return ejs.render(template, {
                        locals: {
                            experiment: experiment,
                            exps: exps
                        }
                    }).replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                }
                return withUser;
            }
            return renderTemplate;
        },
        "with an experiment guarded by an `if` statement ": {
            topic: function (renderTemplate) {
                var template = [
                    '<% if( experiment.variantFor("buttonColor", exps) == "redButton" ) { %>'
                  , '  <button name="red"/>'
                  , '<% } %>'
                ].join("\n");

                return renderTemplate(template);
            },
            'for a user that is part of the "redButton" variant': {
                topic: function (withUser) {
                    return withUser(1);
                },
                "should render the red button": function (result) {
                    assert.equal(result, "<button name=\"red\"/>");
                }
            },
            'for a user that is part of the "greenButton" variant': {
                topic: function (withUser) {
                    return withUser(11);
                },
                "should render nothing": function (result) {
                    assert.equal(result, "");
                }
            },
            'for a user that is NOT part of either variant': {
                topic: function (withUser) {
                    return withUser(22);
                },
                "should render nothing": function (result) {
                    assert.equal(result, "");
                }
            }
        },   

        "with an experiment guarded by a `switch` statement ": {
            topic: function (renderTemplate) {
                var template = [
                    '<% switch( experiment.variantFor("buttonColor", exps) ) { '
                  , '     case "redButton":'
                  , '%>'
                  , '       <button name="red"/>'
                  , '<%     break;  %>'
                  , '<%   case "greenButton":  %>'
                  , '       <button name="green"/>'
                  , '<%     break;  %>'
                  , '<%   default: break;  %>'
                  , '<% } %>'
                ].join("\n");

                return renderTemplate(template);
            },
            'for a user that is part of the "redButton" variant': {
                topic: function (withUser) {
                    return withUser(1);
                },
                "should render the red button": function (result) {
                    assert.equal(result, "<button name=\"red\"/>");
                }
            },
            'for a user that is part of the "greenButton" variant': {
                topic: function (withUser) {
                    return withUser(11);
                },
                "should render the green button": function (result) {
                    assert.equal(result, "<button name=\"green\"/>");
                }
            },
            'for a user that is NOT part of either variant': {
                topic: function (withUser) {
                    return withUser(22);
                },
                "should not render the red button": function (result) {
                    assert.equal(result, "");
                }
            }
        }
    }
}).export(module);
