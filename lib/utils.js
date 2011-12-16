var errors = require("./errors");

exports.normalizeId = normalizeId;
exports.idInRange = idInRange;

function hash(str) {
    var hash = 5381;
    var bytes = new Buffer(str, 'ascii');

    for (var i = 0; i < bytes.length; i++) {
        hash = ((hash << 5) + hash) + bytes[i]; /* hash * 33 + c */
    }
    
    return hash;
}

/**
 * Returns the normalized integer version of the given `userId`.
 */
function normalizeId(userId) {
    var intId = NaN;
    
    if ('number' == typeof userId && !isNaN(userId)) {
      intId = parseInt(userId, 10);
    } else if ('string' == typeof userId) {
      intId = hash(userId);
    }

    if (typeof intId != "number" || isNaN(intId)) {
        throw new errors.InvalidUserIdError(userId);
    }

    return Math.abs(intId);
}

/**
 * Returns `true` if the given `userId` is contained in the given range,
 * inclusive.
 *
 *     idInRange(1, 0, 1) => true
 *     idInRange(1, 1, 1) => true
 *     idInRange(1, 0, 5) => true
 */
function idInRange(userId, lowerBound, upperBound) {
    lowerBound = Math.max(lowerBound, 0) || 0;
    upperBound = Math.min(upperBound, 99) || 99;

    var mod = normalizeId(userId) % 100;
    var inRange = mod >= lowerBound && mod <= upperBound;

    return inRange;
}
