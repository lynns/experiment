var utils = require("./utils"),
    Experiment = require("./experiment");

module.exports = Context;

/**
 * The context for a given `userId` contains information about what kinds of
 * experiments are available to that user.
 */
function Context(userId) {
    this.userId = utils.normalizeId(userId);
}

/**
 * An array of Experiments that are active for the user in this context.
 */
Context.prototype.__defineGetter__("experiments", function () {
    return Experiment.forUser(this.userId);
});

/**
 * An array of names of Experiments that are acitve for the user in this
 * context.
 */
Context.prototype.__defineGetter__("experimentNames", function () {
    return this.experiments.map(function (experiment) {
        return experiment.name;
    });
});

/**
 * Returns the Variant that should be used for this context in the given
 * `experiment`, if any.
 */
Context.prototype.variant = function variant(experiment) {
    return experiment.variantFor(this.userId);
}
