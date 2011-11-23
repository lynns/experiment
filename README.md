This package is a simple framework for building experiments in node apps. The
purpose is to be able to run certain segments of code only when a user who is
part of a certain experiment is using the app.

## Guiding Principles

Make it easy:

  * for developers to declare experiments
  * to enable an experimental feature by:
    * 'everyone'
    * user ID
    * group name
    * % range (user ID % 100 within range)

Make it difficult:

  * for unwanted code to run by accident

## Overview

The _Configuration_ file maps features to user groups. An _Experiment Context_
shows which features and variants are "enabled". It is created by providing a
user id. The framework provides methods that allow the developer to show
portions of the view or execute parts of the controller based on a given
_Experiment Context_. Application developers never use any programming
constructs (like `if` or `case`) to decide if features or variations run --
that's decided entirely by the framework.

The framework doesn't know or care about the rest of the server environment
including HTTP variables and such. It doesn't communicate externally to report
usage or store its data in a database. Instead, applications tie results into
their own frameworks and reporting tools.

## Configuration

Configuration is accomplished by means of a configuration object with the
following properties:

  - groups          An object keyed by the name of a group of users.
  - experiments     An object keyed by the names of the experiments.

A sample configuration object might look like the following:

    {
        "groups": {
            "family search": [1, 2, 3, 4],
            "phase 1": "20-30%",
            "phase 2": "20-50%",
            "phase 3": "20-60%"
        },
        "experiments": {
            "feature one": "phase 1",
            "feature two": ["family search", "3-5%"],
            "feature three": {
                "variant one": "0-20%",
                "variant two": "21-100%"
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
  * An object containing the names of variants

If an experiment is configured with an object with several variants (the last
option), each variant may specify any of the first two values in the above list.
If an experiment is not configured with any variants, it is assigned a variant
named "default" which is the default variant for that experiment.

A percentage of users may be specified either as a single value (e.g. "10%") or
a range of values (e.g. "20-30%"). In the first case the lower bound of the
range is assumed to be 0. Also note that the special group name "everyone" is
an alias for "100%".

## Usage

The basic pattern of usage has three steps:

  1. Configure all groups and experiments.
  2. Create a context for the current user.
  3. Use that context to determine if a portion of the code should run or not.

The example below shows how all three steps can be used inside some controller
code to limit a function to running only for users who are part of a given
experiment.

    var experiment = require("experiment");
    experiment.configureFromFile("config.json");

    // Create a context with the id of the current user.
    var context = experiment.contextFor(userId);

    // Specify a portion of code that is protected from running if the user
    // in the given `context` is not part of the experiment with the given name.
    experiment.protect("feature one", context, function () {
        // This code runs if the user is part of the experiment.
    });

    experiment.protect("feature three/variant one", context, function () {
        // This code runs if the user is part of variant one
        // of the experiment.
    });

In addition to protecting a plain function, you can also use an object that
specifies callbacks that will be run when the user is part of a certain variant.

    experiment.protect("feature one", context, {
        "variant one": function () {
            // This code runs if the user is part of variant one.
        },
        "variant two": function () {
            // This code runs if the user is part of variant two.
        }
    });

## TODO

Make something like this work with ejs:

    <h1><%= title %></h1>
    <p>
      <% experiment.protect("button_color", context, { %>

         <% "red_button": function() { %>
            <a class="button error">Click</a>
         <% }, %>

         <% "green_button": function() { %>
            <a class="button go">Click</a>
         <% }, %>

      <% }); %>
    </p>

    <% experiment.protect("invite_friends", context, function(){ %>
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

    $ vows test/*_test.js
