var utils = require("./utils");

module.exports = Variant;

function Variant(name) {
    this.name = name;
    this.groups = []; // array of groups
    this.lowerBound = null;
    this.upperBound = null;
}

/**
 * Adds the given `group` to this variant.
 */
Variant.prototype.addGroup = function addGroup(group) {
    this.groups.push(group);
}

/**
 * Sets the lower and upper bounds for the percentage of users this variant
 * contains. If `upperBound` is omitted, the `lowerBound` is used as the upper
 * bound and the lower bound is assumed to be 0.
 */
Variant.prototype.setPercentage = function setPercentage(lowerBound, upperBound) {
    if (typeof upperBound == "undefined") {
        upperBound = lowerBound;
        lowerBound = 0;
    }

    this.lowerBound = Math.max(parseInt(lowerBound, 10) || 0, 0);
    this.upperBound = Math.min(parseInt(upperBound, 10) || 100, 100);
}

/**
 * Returns `true` if this variant contains the user with the given `userId`.
 */
Variant.prototype.contains = function contains(userId) {
    userId = utils.normalizeId(userId);

    var group;
    for (var i = 0, len = this.groups.length; i < len; ++i) {
        group = this.groups[i];
        if (group.contains(userId)) {
            return true;
        }
    }

    if (typeof this.lowerBound == "number" && typeof this.upperBound == "number") {
        return utils.idInRange(userId, this.lowerBound, this.upperBound);
    }

    return false;
}
