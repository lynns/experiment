var utils = require("./utils");

module.exports = Context;

/**
 * The context for a given `userId` contains information about what kinds of
 * experiments are available to that user.
 */
function Context(sessionId, userId) {
  this.sessionId = sessionId || utils.generateSessionId();
  this.userId = userId;
}