var assert = require("assert"),
    vows = require("vows"),
    path = require("path"),
    eco = require("eco"),
    experiment = require("./../lib");
    eco_plugin = require("./../lib/eco_plugin");

experiment.configure({
    experiments: {
        "button color": {
            "red button": "0-10%",
            "green button": "11-20%"
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
                      feature:   eco_plugin.feature,
                      variation: eco_plugin.variation,
                      user_context: context
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
                  '<%= if @feature "button color/red button": %>',
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
                    assert.equal(result, "<button name=\"red\"/>");
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
        }
    },

    "An Eco template with variations": {
        topic: function () {
            var template = [
                '<% switch @feature "button color": %>'
              , '  <% when "red button": %>'
              , '    <a class="button error">Click</a>'
              , ''
              , '  <% when "green button": %>'
              , '    <a class="button go">Click</a>'
              , ''
              , '  <% else: %>'
              , '    <a class="button normal">Click</a>'
              , ''
              , '<% end %>'
            ].join("\n");

            return template;
        },
        'for a user that is part of the "red button" variant': {
            topic: function (template) {
                var context = experiment.contextFor(1);

                var result = eco.render(template, {
                  feature:   experiment.variantFor,
                  user_context: context
                });

                return result.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
            },
            "should render correctly": function (result) {
                assert.equal(result, '<button name="red"/>');
            }
        }
    }


}).export(module);
