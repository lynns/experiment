This package is a simple framework for building experiments in node apps. The
purpose is to be able to run certain segments of code only when a user who is
part of a certain experiment is using the app.

## Guiding Principles

Make it easy:

  * for developers to declare experiments
  * to enable an experimental feature by:
    * true/false - on or off for everyone
    * user ID
    * group name
    * % range (user ID % 100 within range)
  * to set default experiment values based on deployment environment

Make it difficult:

  * for unwanted code to run by accident

## Overview

The _Configuration_ file maps features to user groups. An _Experiment Context_
shows which features and variants are "enabled". It is created by providing a
user id. The framework provides methods that allow the developer to show
portions of the view or execute parts of the controller based on a given
_Experiment Context_.

The framework doesn't know or care about the rest of the server environment
including HTTP variables and such. It doesn't communicate externally to report
usage or store its data in a database. Instead, applications tie results into
their own frameworks and reporting tools.

## Configuration

Configuration is accomplished by means of a configuration object with the
following properties:

  - groups          An object keyed by the name of a group of users.
  - experiments     An object keyed by the names of the experiments.
  - envs            An object keyed by deployment environment names (i.e., local, dev, test, prod).

A sample configuration object might look like the following:

    {
        "groups": {
            "family search": [1, 2, 3, 4],
            "phase 1": "20-30%",
            "phase 2": "20-50%",
            "phase 3": "20-60%"
        },
        "experiments": {
            "featureOne": "phase 1",
            "featureTwo": ["family search", "3-5%"],
            "featureThree": {
                "variantOne": "0-20%",
                "variantTwo": "21-100%"
            },
            "featureFour": true
        }
        "envs": {
            "prod": {
                "featureFour": false
            }
        }
    }

Each property of the `groups` object specifies the name of a group of users. It
may have any of the following values:

  * A user id
  * A percentage of users
  * An array of user id(s) and/or a percentage of users

Each property of the `experiments` object specifies the name of an experiment.
It may have any of the following values:

  * The name of a group or a percentage of users
  * An array of group name(s) and/or a percentage of users
  * A boolean indicating if the experiment is on or off for all users
  * An object containing the names of variants

Each property of the `envs` object specifies the name of a deployment environment.
It may have any value and is resolved against the runtime environment variable `TARGET_ENV` by default.
You may specify a different environment variable for determining what your app's runtime environment is
by adding the `DEPLOYMENT_ENV_VARIABLE` property to your config file.
The `envs` property allows you to override experiment settings based on the runtime deployment
environment.  In the example above, the `featureFour` experiment would be on by default for
all environments, except `prod` where the default has been overridden.

If an experiment is configured with an object with several variants (the last
option), each variant may specify any of the first two values in the above list.
If an experiment is not configured with any variants, it is assigned a variant
named "default" which is the default variant for that experiment.

A percentage of users may be specified either as a single value (e.g. "10%") or
a range of values (e.g. "20-30%"). In the first case the lower bound of the
range is assumed to be 0.

## Usage

The basic pattern of usage has three steps:

  1. Configure all groups and experiments.
  2. Create a context for the current user.
  3. Use that context to determine if a portion of the code should run or not.

The example below shows how all three steps can be used inside some
code with simple if statements.

    var experiment = require("experiment");
    experiment.configureFromFile("config.json");

    // Create a context with the id of the current user.
    var context = experiment.contextFor(userId);

    // Specify a portion of code that is protected from running if the user
    // in the given `context` is not part of the experiment with the given name.
    if( experiment.variantFor("featureOne", context) ) {
        // This code runs if the user is part of ANY variant in the experiment.
    } else {
        // This code runs if the user is NOT part of the experiment.
    }

    if( experiment.variantFor("featureThree/variantOne", context) ) {
        // This code runs if the user is part of variantOne
        // of the experiment.
    }

In addition to protecting code with an if statement, you can also use a
switch statement to vary the code run for each variant.

    switch( experiment.variantFor("featureOne", context) ) {
        "variantOne":
            // This code runs if the user is part of variantOne.
            break;
        "variantTwo":
            // This code runs if the user is part of variantTwo.
            break;
        default:
            // This code runs if the user is not part of any variant of "featureOne"
    }

It works exactly the same way in EJS views:

    <h1><%= title %></h1>
    <p>
      <% switch( experiment.variantFor("buttonColor", context) ) { %>
        <% case "redButton": %>
          <a class="button error">Click</a>
        <%   break; %>
        <% case "greenButton": %>
          <a class="button go">Click</a>
        <%   break; %>
      <% } %>
    </p>

    <% if( experiment.variantFor("inviteFriends", context) ) { %>
      <p>Invite your friends!! <a href="#">Get Started</a>.</p>
    <% } %>


## Conditional Usage

For cases where you want to use the native conditional support of the language, 
a `feature` function is provided.  The `feature` function takes in a feature name
and context and returns either the name of the variant active for the given context,
or false if no variants are active.  This can be useful in multiple ways, such as:

In a controller class:

    if(experiment.feature("feature one", ctx))
      console.log("I'm in!!");

    switch(experiment.feature("feature two", ctx)) {
        case "variant 1":
            console.log("Variant 1 is active");
            break;
        case "variant 2":
            console.log("Variant 2 is active");
            break;
        default:
            console.log("The default path is active");
    }

Or in an eco template:

    <% if experiment.feature 'feature one', ctx: %>
      <h1>Experimental Title</h1>
    <% else: %>
      <h1>Default Title</h1>
    <% end %>

### Selecting a Callback

If the user needs to first determine whether or not any function can be called
for a given user context, a lower-level `select` function is provided that will
select the appropriate callback to use from an object of variant name/callback
pairs. This can be useful when the code doesn't fit the `protect` use case,
e.g.:

    var callback = experiment.select("feature one", context, {
        "variant one": function () {
            // This code runs if the user is part of variant one.
        },
        "variant two": function () {
            // This code runs if the user is part of variant two.
        }
    });

    if (callback) {
        callback();
    }

This can be very useful when the user needs to have a reference to the callback
to pass to a template engine like [Mustache](http://mustache.github.com), for
example.

    var mustache = require("mustache");

    // If the user in the given `context` is part of feature three/variant one,
    // the `invited` variable will contain a function that is used as the value
    // of the `invited` template variable.
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

    mustache.to_html(template, view);

### Falling Back

When there is a piece of code that you need to run when the user is *not* part
of the given context, you may use a fallback function. A fallback function uses
the special property name `fallback` inside the object of possible callbacks.

    experiment.protect("feature one", context, {
        "variant one": function () {
            // This code runs if the user is part of variant one.
        },
        "fallback": function () {
            // This code runs if the user is *not* part of variant one.
        }
    });


## Installation

Assuming you have a working installation of [node.js](http://nodejs.org/) and
[npm](http://npmjs.org/), you can install all dependencies of this package by
executing `npm install` from the root directory of the package.

You can learn more about how to install node and npm [on the node wiki](https://github.com/joyent/node/wiki/Installation).

## Tests

To run the tests, first make sure you install all of the package's dependencies
(see Installation above).

Next, use [vows](http://vowsjs.org/) to run the test suite.

    $ vows test/*_test.js
