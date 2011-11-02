var strata = require("strata"),
    Request = strata.Request;

module.exports = function (app) {
    return function (env, callback) {
        var req = new Request(env);

        req.query(function (err, query) {

        });
    }
}
