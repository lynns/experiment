var util = require("util"),
    UserError = require("usererror");

exports.InvalidConfigurationError = InvalidConfigurationError;
exports.InvalidUserIdError = InvalidUserIdError;

/**
 * Thrown when there is a configuration error.
 */
function InvalidConfigurationError(message, e) {
    message = message || "Invalid configuration";
    UserError.call(this, message, e);
}

util.inherits(InvalidConfigurationError, UserError);

/**
 * Thrown when the given user `id` is not valid.
 */
function InvalidUserIdError(id) {
    var message = "Invalid user id: " + id;
    UserError.call(this, message);
}

util.inherits(InvalidUserIdError, UserError);
