This package is a simple framework for building UI experiments in web apps.

## Configuration

The configuration object may have the following keys:

  - groups          This should be an object keyed by the name of a group of
                    users. The value of each key should be an array of the id's
                    of users that belong to that group.
  - experiments     This is an object keyed by the names of the experiments.
                    Each value defines the set of users that are subject to that
                    experiment.

A sample configuration object might look like the following:

    {
        "groups": {
            "family search": [1, 2, 3, 4]
        },
        "experiments": {
            "feature one": "10%",
            "feature two": ["family_search", "10%"],
            "feature three": {
                "variant_one": "20%",
                "variant_two": "80%"
            }
        }
    }

## Installation

Assuming you have a working installation of [node.js](http://nodejs.org/) and
[npm](http://npmjs.org/), you can install all dependencies of this package by
executing `npm install` from the root directory of the package.

You can learn more about how to install node and npm [on the node wiki](https://github.com/joyent/node/wiki/Installation).

## Tests

To run the tests, first make sure you install all of the package's dependencies
(see Installation above). Then create and prepare a test database.

    $ mysql -e "CREATE DATABASE experiment_test"
    $ mysql -D experiment_test < schema.sql

Next, use [vows](http://vowsjs.org/) to run the test suite. To run the tests for
the entire package use:

    $ DATABASE_NAME=experiment_test vows test/*_test.js

To run the tests for a specific module, use:

    $ DATABASE_NAME=experiment_test vows test/experiment_test.js
