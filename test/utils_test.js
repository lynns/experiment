var assert = require("assert"),
    vows = require("vows"),
    errors = require("./../lib/errors");
    utils = require("./../lib/utils");

var itWorksProperlyAnd = function(userId, vows) {
  var base = {
      topic: utils.normalizeId(userId),
      "it returns a valid positive integer": function (normalized) {
        assert.isNumber(normalized);
        assert.equal(Math.floor(normalized), Math.ceil(normalized));
        assert.isTrue(normalized > 0);
      }
  }
  
  for (var key in vows) {
    base[key] = vows[key];
  }
  
  return base;
}

vows.describe("utils").addBatch({
    "When I normalize a user id that is": {
        "undefined": {
            "it raises an error": function () {
                assert.throws( function() { utils.normalizeId() }, errors.InvalidUserIdError );
            },
        },
        "an object": {
            "it raises an error": function () {
                assert.throws( function() { utils.normalizeId( {} ) }, errors.InvalidUserIdError );
            },
        },
        "an integer,": itWorksProperlyAnd(1, {
            "it returns the given user id": function (normalized) {
                assert.equal(normalized, 1);
            }
        }),
        "a negative integer,": itWorksProperlyAnd(-1, {
            "it returns absolute value of the given user id": function (normalized) {
                assert.equal(normalized, 1);
            }
        }),
        "a float,": itWorksProperlyAnd(1.7, {
            "it truncates the given user id": function (normalized) {
                assert.equal(normalized, 1);
            }
        }),
        "a negative float,": itWorksProperlyAnd(-1.7, {
            "it truncates the absolute value of the given user id": function (normalized) {
                assert.equal(normalized, 1);
            }
        }),
        "a string": itWorksProperlyAnd("my string", {
            "returns a consistent integer": function (normalized) {
                assert.equal(normalized, 365786686);
            }
        }),
    }
}).export(module);
