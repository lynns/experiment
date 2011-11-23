var utils = require("./utils");

module.exports = Group;

// A local store of group names to Group objects.
var groups = {};

function Group(name) {
    this.name = name;
    this.userIds = []; // array of user id's
    this.lowerBound = null;
    this.upperBound = null;
}

Group.prototype.__defineGetter__("name", function () {
    return this._name;
});

Group.prototype.__defineSetter__("name", function (name) {
    if (this._name) {
        delete groups[this._name];
    }

    this._name = name;

    // Store in the cache.
    groups[name] = this;
});

/**
 * Adds the user with the given `userId` to this group.
 */
Group.prototype.addUser = function addUser(userId) {
    this.userIds.push(utils.normalizeId(userId));
}

/**
 * Sets the lower and upper bounds for the percentage of users this group
 * contains. If `upperBound` is omitted, the `lowerBound` is used as the upper
 * bound and the lower bound is assumed to be 0.
 */
Group.prototype.setPercentage = function setPercentage(lowerBound, upperBound) {
    if (typeof upperBound == "undefined") {
        upperBound = lowerBound;
        lowerBound = 0;
    }

    this.lowerBound = Math.max(parseInt(lowerBound, 10) || 0, 0);
    this.upperBound = Math.min(parseInt(upperBound, 10) || 100, 100);
}

/**
 * Returns `true` if this group contains the user with the given `userId`.
 */
Group.prototype.contains = function contains(userId) {
    userId = utils.normalizeId(userId);

    if (this.userIds.indexOf(userId) != -1) {
        return true;
    }

    if (typeof this.lowerBound == "number" && typeof this.upperBound == "number") {
        return utils.idInRange(userId, this.lowerBound, this.upperBound);
    }

    return false;
}

/**
 * Gets the Group with the given `name`.
 */
Group.byName = function byName(name) {
    return groups[name];
}

/**
 * Returns an array of all Groups that contain the user with the given `userId`.
 */
Group.forUser = function forUser(userId) {
    var result = [];

    var group;
    for (var name in groups) {
        group = groups[name];
        if (group.contains(userId)) {
            result.push(group);
        }
    }

    return result;
}
