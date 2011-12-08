var assert = require("assert"),
    vows = require("vows"),
    path = require("path"),
    ejs = require("ejs"),
    experiment = require("./../lib");

experiment.configure({
    experiments: {
        "button color": {
            "red button": "0-10%",
            "green button": "11-20%"
        }
    }
});

vows.describe("ejs").addBatch({
    "An ejs template with the experiment module embedded": {
        topic: function () {
            var template = [
              '<% experiment.protect("button color", context, { %>',
                '<% "red button": function () { %>',
                  '<a class="button error">Click</a>',
                '<% }, %>',
                '<% "green button": function () { %>',
                  '<a class="button go">Click</a>',
                '<% } %>',
              '<% }); %>'
            ].join("\n");

            return template;
        },
        'for a user that is part of the "red button" variant': {
            topic: function (template) {
                var context = experiment.contextFor(1);
                var result = ejs.render(template, {
                    debug: true,
                    locals: {
                        experiment: experiment,
                        context: context
                    }
                });

                return result;
            },
            "should render correctly": function (result) {
                assert.equal(result, ""); // fails :(
            }
        }
    }
}).export(module);
