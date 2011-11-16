This package is a simple framework for building UI experiments in web apps.

## Configuration

The configuration object may have the following keys:

  - groups          This should be an object keyed by the name of a group of
                    users. The value of each key should be an array of the id's
                    of users that belong to that group.
  - experiments     This is an object keyed by the names of the experiments.
                    Each value defines the set of users that are subject to that
                    experiment.


## Guiding Principles

* Make it easy
  * for devs to declare experiments
  * to enable an experimental feature by:
    * 'everyone'
    * user ID
    * group name
    * % range  (user ID % 100 within range)

* Make it hard
  * for unwanted code to run on accident


## Responsibilities

The _Configuration_ files maps features to user groups. An _Experiment Context_
shows which features and variants are "enabled", and an experiment context
can be created by providing an id. The _Code Protections_ shows portions of
the view or executes parts of the controller based on the current
_Experiment Context_. _Application Developers_ never use any programming constructs
(like `if` or `case`) to decide if features or variations run -- that's decided
entirely by the _Experiment Framework_.

The _Experiment Framework_ doesn't know about HTTP frameworks. It doesn't communicate
externally to report usage. _Applications_ tie results into their own HTTP frameworks
and reporting tools.

A sample configuration object might look like the following:

    {
        "groups": {
            "family search": [1, 2, 3, 4]
          , "phase 1"  : "20...30%"
          , "phase 2"  : "20...50%"
          , "phase 3"  : "20...60%"
        },
        "experiments": {
            "feature one": "phase 1",
            "feature two": ["family_search", "3...5%"],
            "feature three": {
                "variant_one": "0...20%",
                "variant_two": "20...100%"
            }
        }
    }
    

Resolving the experiment list for the current user:

    // Resolve experiment before each code block
    var experiment_context = experiment.user_context(user_id);

    // App can memoize this
    req.experiment_context = experiment.user_context(user_id);


The context contains a list of which experiments are enabled for the user
(and may contain other private data):

    > var experiment_context = experiment.user_context(user_id);
    > console.log( experiment_context.experiments );
    ["feature one", "feature three/variant_one"]


To protect your controller code:

    var experiment = require('experiment');

    // Assuming it's been previously memoized elsewhere
    var context = req.experiment_context;

    // Pass a function when not using variants
    experiment.feature("feature one", context, function() {

    });


    // Pass an object with declared variants
    experiment.feature("feature three", context, {

      "variant_one": function() {

      },

      "variant_two": function() {

      }

    });   
    

To protect your view code:

    <h1><%= title %></h1>
    <p>
      <% experiment.feature("button_color", context, { %>

         <% "red_button": function() { %>
            <a class="button error">Click</a>
         <% }, %>

         <% "green_button": function() { %>
            <a class="button go">Click</a>
         <% }, %>

      <% }); %>
    </p>

    <% experiment.feature("invite_friends", context, function(){ %>
      <p>Invite your friends!! <a href="#">Get Started</a>.</p>
    <% }); %>


## Installation

Assuming you have a working installation of [node.js](http://nodejs.org/) and
[npm](http://npmjs.org/), you can install all dependencies of this package by
executing `npm install` from the root directory of the package.

You can learn more about how to install node and npm [on the node wiki](https://github.com/joyent/node/wiki/Installation).

## Tests

To run the tests, first make sure you install all of the package's dependencies
(see Installation above).

Next, use [vows](http://vowsjs.org/) to run the test suite.