exports.noop = noop;
exports.isNew = isNew;
exports.buildSet = buildSet;
exports.conversionName = conversionName;

function noop() {}

/**
 * Returns `true` if the given `obj` is new (has not been previously stored in
 * the database).
 */
function isNew(obj) {
    return typeof obj.id == "undefined";
}

function buildSet(props) {
    var fields = [];
    var values = [];

    for (var prop in props) {
        fields.push(prop + "=?");
        values.push(props[prop]);
    }

    var sql = "SET " + fields.join(", ");

    return {sql: sql, values: values};
}

function conversionName(name) {
    return String(name).toLowerCase().replace(/[^a-z]/g, "_");
}
