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
 * Gets the Experiment with the given `name`.
 */
Experiment.byName = function byName(name) {
    return experiments[name];
}

///**
// * Returns the first Variant of this Experiment that contains the user with the
// * given `userId`, if any.
// */
//Experiment.prototype.variantFor = function variantFor(userId) {
//  userId = utils.normalizeId(userId);
//
//  var variant;
//  for (var i = 0, len = this.variants.length; i < len; ++i) {
//    variant = this.variants[i];
//    if (variant.contains(userId)) {
//      return variant;
//    }
//  }
//
//  return null;
//}

/**
 * Returns an object that has the state of each of the variants for this feature given the `context`.
 */
Experiment.prototype.stateFor = function stateFor(context) {
  if(this.variants.length === 1) {
    return this.variants[0].contains(context.sessionId, context.userId);
  }
  
  var feature = {};
  for (var i = 0, len = this.variants.length; i < len; ++i) {
    var variant = this.variants[i];
    feature[variant.name] = variant.contains(context.sessionId, context.userId);
  }

  return feature;
}

/**
 * Returns a snapshot of all features/variants and they're state relative to the provided `context`.
 */
Experiment.forContext = function forContext(context, exps) {
  var result = exps || {};
    
  result.sessionId = context.sessionId;
  result.features = result.features || {};
  result.dirtyFeatures = result.dirtyFeatures || []; //list of features in exps that have been explicitly set and should not be changed here

  var experiment;
  for (var experimentName in experiments) {
    if(result.dirtyFeatures.indexOf(experimentName) === -1) { //not on the dirty list
      experiment = experiments[experimentName];
      result.features[experimentName] = experiment.stateFor(context);
    }
  }

  return result;
}
