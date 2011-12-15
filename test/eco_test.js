var assert = require("assert"),
    vows = require("vows"),
    path = require("path"),
    eco = require("eco"),
    experiment = require("./../lib");

experiment.configure({
    experiments: {
        "button color": {
            "red button": "0-10%",
            "green button": "11-20%"
        }
    }
});

vows.describe("eco").addBatch({
    "An Eco template with a protected block": {
        topic: function () {
            var template = [
              '<%= @feature "button color/red button", @user_context, run: => %>',
              '    <button name="red"/>',
              '<% end %>'
            ].join("\n");

            return template;
        },
        'for a user that is part of the "red button" variant': {
            topic: function (template) {
                var context = experiment.contextFor(1);

                var result = eco.render(template, {
                  feature:   function(name, context, variation_builder) {
                    return experiment.protect(name, context, variation_builder.run);
                  },
                  variation: function(name, thing) {
                    this.__variations[name] = thing;
                  },
                  user_context: context
                });

                return result;
            },
            "should render correctly": function (result) {
                assert.equal(result.replace(/^\s\s*/, '').replace(/\s\s*$/, ''), '<button name="red"/>');
            }
        }
    },

    "An Eco template with variations": {
        topic: function () {
            var template = [
              '<%= @feature "button color", @user_context, variations: => %>',
              '  <% @variation "green button", => %>',
              '    <button name="green"/>',
              '  <% end %>',
              '',
              '  <% @variation "red button", => %>',
              '    <button name="red"/>',
              '  <% end %>',
              '<% end %>'
            ].join("\n");

            return template;
        },
        'for a user that is part of the "red button" variant': {
            topic: function (template) {
                var context = experiment.contextFor(1);

                var result = eco.render(template, {
                  feature:   function(name, context, variation_builder) {
                    // Make this a stack later, to push nested @features ??
                    this.__variations = {};
                    variation_builder.variations();
                    return experiment.protect(name, context, this.__variations);
                  },
                  variation: function(name, thing) {
                    this.__variations[name] = thing;
                  },
                  user_context: context
                });

                return result;
            },
            "should render correctly": function (result) {
                assert.equal(result.replace(/^\s\s*/, '').replace(/\s\s*$/, ''), '<button name="red"/>');
            }
        }
    }


}).export(module);
