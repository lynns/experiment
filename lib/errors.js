var util = require("util"),
    UserError = require("usererror");

exports.InvalidConfigurationError = InvalidConfigurationError;

/**
 * Thrown when there is a configuration error.
 */
function InvalidConfigurationError(message, e) {
    message = message || "Invalid configuration";
    UserError.call(this, message, e);
}

util.inherits(InvalidConfigurationError, UserError);
