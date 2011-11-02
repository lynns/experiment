module.exports = Group;

/**
 * A local store of group names to Group objects. These are not stored in the
 * database but are instead stored in the JSON configuration file.
 */
var groups = {};

function Group(props) {
    props = props || {};
    this.name = props.name;
    this.userIds = props.userIds || [];
}

/**
 * Returns an array of names of user groups the user with the given `userId` is
 * a part of.
 */
Group.namesForUser = function namesForUser(userId) {
    var names = [];

    for (var name in groups) {
        if (groups[name].indexOf(userId) != -1) {
            names.push(name);
        }
    }

    return names;
}

/**
 * Returns `true` if the user with the given `userId` is in the group with the
 * given `name`.
 */
Group.hasUser = function hasUser(name, userId) {
    return Group.namesForUser(userId).indexOf(name) != -1;
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
 * Returns `true` if this group contains the user with the given `userId`.
 */
Group.prototype.hasUser = function hasUser(userId) {
    return this.userIds.indexOf(userId) != -1;
}
