var experiment = require('./');

exports.feature = feature;
exports.variation = variation;

function feature(name, context, options) {
  if (options.run) {
    return experiment.protect(name, context, options.run);
  } else if (options.variations) {
    // TODO: Expect => in Eco template...risky-ish
    // TODO: Make this a stack later, to push nested @features ??
    this.__variations = {};
    options.variations();
    return experiment.protect(name, context, this.__variations);
  }

  return null;
}

function variation(name, callback) {
  this.__variations[name] = callback;
}
