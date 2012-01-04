var assert = require("assert"),
    vows = require("vows"),
    path = require("path"),
    eco = require("eco"),
    experiment = require("./../lib");
    eco_plugin = require("./../lib/eco_plugin");

experiment.configure({
    experiments: {
        "buttonColor": {
            "redButton": "0-10%",
            "greenButton": "11-20%"
        }
    }
});

vows.describe("eco").addBatch({
    "An Eco template ": {
        topic: function() {
            var renderTemplate = function(template) {
                var withUser = function(user) {
                    var context = experiment.contextFor(user);
                    var result = eco.render(template, {
                      feature:   function(name) {
                          return experiment.feature(name, context);
                      }
                    });

                    return result.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                }
                return withUser;
            }
            return renderTemplate;
        },
        "with an experiment guarded by an `if` statement ": {
            topic: function (renderTemplate) {
                var template = [
                  '<% if @feature "buttonColor/redButton": %>',
                  '    <button name="red"/>',
                  '<% end %>'
                ].join("\n");

                return renderTemplate(template);
            },
            'for a user that is part of the "redButton" variant': {
                topic: function (withUser) {
                    return withUser(1);
                },
                "should render the red button": function (result) {
                    assert.equal(result, '<button name="red"/>');
                }
            },
            'for a user that is part of the "greenButton" variant': {
                topic: function (withUser) {
                    return withUser(11);
                },
                "should render the red button": function (result) {
                    assert.equal(result, "");
                }
            },
            'for a user that is not part of either variant': {
                topic: function (withUser) {
                    return withUser(22);
                },
                "should render the red button": function (result) {
                    assert.equal(result, "");
                }
            }
        },
        
        "with an experiment guarded by `else if` statements": {
            topic: function (renderTemplate) {
                var template = [
                    '<% if @feature "buttonColor/redButton": %>'
                  , '  <a class="button error">Click</a>'
                  , '<% else if @feature "buttonColor/greenButton": %>'
                  , '  <a class="button go">Click</a>'
                  , '<% else: %>'
                  , '  <a class="button normal">Click</a>'
                  , '<% end %>'
                ].join("\n");

                return renderTemplate(template);
            },
            'for a user that is part of the "redButton" variant': {
                topic: function (withUser) {
                    return withUser(1);
                },
                "should render the red button": function (result) {
                    assert.equal(result, '<a class="button error">Click</a>');
                }
            }
        }
        
    }

}).export(module);
