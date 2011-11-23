var utils = require("./utils");

module.exports = Experiment;

// A local store of experiment names to Experiment objects.
var experiments = {};

function Experiment(name) {
    this.name = name;
    this.variants = []; // array of variants
}

Experiment.prototype.__defineGetter__("name", function () {
    return this._name;
});

Experiment.prototype.__defineSetter__("name", function (name) {
    if (this._name) {
        delete experiments[this._name];
    }

    this._name = name;

    // Store in the cache.
    experiments[name] = this;
});

/**
 * Adds the given `variant` to this experiment.
 */
Experiment.prototype.addVariant = function addVariant(variant) {
    this.variants.push(variant);
}

/**
 * Returns the first Variant of this Experiment that contains the user with the
 * given `userId`, if any.
 */
Experiment.prototype.variantFor = function variantFor(userId) {
    userId = utils.normalizeId(userId);

    var variant;
    for (var i = 0, len = this.variants.length; i < len; ++i) {
        variant = this.variants[i];
        if (variant.contains(userId)) {
            return variant;
        }
    }

    return null;
}

/**
 * Returns `true` if this experiment is active for the user with the given
 * `userId`.
 */
Experiment.prototype.activeFor = function activeFor(userId) {
    return !!this.variantFor(userId);
}

/**
 * Gets the Experiment with the given `name`.
 */
Experiment.byName = function byName(name) {
    return experiments[name];
}

/**
 * Returns an array of all Experiments that are active for the user with the
 * given `userId`.
 */
Experiment.forUser = function forUser(userId) {
    var result = [];

    var experiment;
    for (var experimentName in experiments) {
        experiment = experiments[experimentName];
        if (experiment.activeFor(userId)) {
            result.push(experiment);
        }
    }

    return result;
}
