var sprintf = require("sprintf").sprintf,
    utils = require("./utils"),
    db = require("./db"),
    Variant = require("./variant");

module.exports = Experiment;

function Experiment(props) {
    props = props || {};
    this.id = props.id;
    this.createdAt = props.created_at || props.createdAt || new Date;
    this.name = props.name;
    this.startedAt = props.started_at;
    this.conversionType = props.conversion_type || props.conversionType || "binary";
    this.conversionName = utils.conversionName(props.name);
    this.live = props.live == 1;
}

Experiment.save = function save(experiment, callback) {
    callback = callback || utils.noop;

    var set = utils.buildSet({
        created_at: experiment.createdAt,
        name: experiment.name,
        started_at: experiment.startedAt,
        conversion_type: experiment.conversionType,
        conversion_name: experiment.conversionName,
        live: experiment.live ? 1 : 0
    });

    if (utils.isNew(experiment)) {
        var sql = "INSERT INTO experiments " + set.sql;

        db.query(sql, set.values, function (err, result) {
            if (err) {
                callback(err);
            } else {
                experiment.id = result.insertId;
                callback(null);
            }
        });
    } else {
        var sql = "UPDATE experiments " + set.sql + " WHERE id=?";
        set.values.push(experiment.id);

        db.query(sql, set.values, function (err) {
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        });
    }
}

Experiment.exists = function exists(name, callback) {
    var sql = "SELECT id FROM experiments WHERE name=?";

    db.query(sql, [name], function (err, result) {
        if (err) {
            callback(err);
        } else {
            callback(null, result.length > 0);
        }
    });
}

Experiment.find = function find(id, callback) {
    var sql = "SELECT * FROM experiments WHERE id=?";

    db.query(sql, [id], function (err, result) {
        if (err) {
            callback(err);
        } else if (result.length > 0) {
            callback(null, new Experiment(result[0]));
        } else {
            callback(null, null);
        }
    });
}

Experiment.findByName = function findByName(name, callback) {
    var sql = "SELECT * FROM experiments WHERE name=?";

    db.query(sql, [name], function (err, result) {
        if (err) {
            callback(err);
        } else if (result.length > 0) {
            callback(null, new Experiment(result[0]));
        } else {
            callback(null, null);
        }
    });
}

Experiment.prototype.save = function save(callback) {
    Experiment.save(this, callback);
}

/**
 * Fetches all variants that are part of this experiment from the database.
 */
Experiment.prototype.variants = function (callback) {
    if (utils.isNew(this)) {
        callback(null, []);
    }

    Variant.findByExperimentId(this.id, callback);
}

/**
 * Calculates the conversion rate of this experiment from the sum of all
 * variants.
 */
Experiment.prototype.conversionRate = function (callback) {
    this.variants(function (err, variants) {
        if (err) {
            callback(err);
        } else {
            var participants = 0;
            var conversions = 0;

            for (var i = 0; i < variants.length; ++i) {
                participants += variants[i].participants;
                conversions += variants[i].conversions;
            }

            if (participants > 0) {
                callback(null, conversions / participants);
            } else {
                callback(null, 0);
            }
        }
    })
}

Experiment.prototype.prettyConversionRate = function prettyConversionRate(callback) {
    this.conversionRate(function (err, conversionRate) {
        if (err) {
            callback(err);
        } else {
            callback(null, sprintf("%4.2f%%", conversionRate * 100));
        }
    });
}

/**
 * Returns `true` if this experiment is currently active for the user with the
 * given `userId`.
 */
Experiment.prototype.isActive = function isActive(userId) {
    // TODO
}
