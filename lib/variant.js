var sprintf = require("sprintf").sprintf,
    utils = require("./utils"),
    db = require("./db");

module.exports = Variant;

function Variant(props) {
    props = props || {};
    this.id = props.id;
    this.experimentId = props.experiment_id;
    this.createdAt = props.created_at || new Date;
    this.participants = props.participants || 0;
    this.conversions = props.conversions || 0;
    this.weight = ("weight" in props) ? props.weight : 1;
    this.live = props.live == 1;
}

Variant.save = function save(variant, callback) {
    callback = callback || utils.noop;

    var set = utils.buildSet({
        experiment_id: variant.experimentId,
        created_at: variant.createdAt,
        participants: variant.participants,
        conversions: variant.conversions,
        weight: variant.weight,
        live: variant.live ? 1 : 0
    });

    if (utils.isNew(variant)) {
        var sql = "INSERT INTO variants " + set.sql;

        db.query(sql, set.values, function (err, result) {
            if (err) {
                callback(err);
            } else {
                variant.id = result.insertId;
                callback(null);
            }
        });
    } else {
        var sql = "UPDATE variants " + set.sql + " WHERE id=?";
        set.values.push(variant.id);

        db.query(sql, set.values, function (err) {
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        });
    }
}

Variant.find = function find(id, callback) {
    var sql = "SELECT * FROM variants WHERE id=?";

    db.query(sql, [id], function (err, result) {
        if (err) {
            callback(err);
        } else if (result.length > 0) {
            callback(null, new Variant(result[0]));
        } else {
            callback(null, null);
        }
    });
}

Variant.findByExperimentId = function findByExperimentId(experimentId, callback) {
    var sql = "SELECT * FROM variants WHERE experiment_id=?";

    db.query(sql, [experimentId], function (err, result) {
        if (err) {
            callback(err);
        } else if (result.length > 0) {
            var variants = result.map(function (props) {
                return new Variant(props);
            });

            callback(null, variants);
        } else {
            callback(null, null);
        }
    });
}

Variant.prototype.save = function save(callback) {
    Variant.save(this, callback);
}

Variant.prototype.__defineGetter__("conversionRate", function () {
    if (this.participants > 0) {
        return this.conversions / this.participants;
    }

    return 0;
});

Variant.prototype.__defineGetter__("prettyConversionRate", function () {
    return sprintf("%4.2f%%", this.conversionRate);
});

/**
 * Increment the number of users who have seen this variant.
 */
Variant.prototype.incrementParticipants = function incrementParticipants(callback) {
    callback = callback || utils.noop;

    var self = this;
    var success = function () {
        self.participants += 1;
        callback(null);
    }

    if (utils.isNew(this)) {
        success();
    } else {
        var sql = "UPDATE variants SET participants=participants+1 WHERE id=?";

        db.query(sql, [this.id], function (err, result) {
            if (err) {
                callback(err);
            } else {
                success();
            }
        });
    }
}

/**
 * Increment the number of users who saw this variant and scored a conversion.
 */
Variant.prototype.incrementConversions = function incrementConversions(callback) {
    callback = callback || utils.noop;

    var self = this;
    var success = function () {
        self.conversions += 1;
        callback(null);
    }

    if (utils.isNew(this)) {
        success();
    } else {
        var sql = "UPDATE variants SET conversions=conversions+1 WHERE id=?";

        db.query(sql, [this.id], function (err, result) {
            if (err) {
                callback(err);
            } else {
                success();
            }
        });
    }
}

/**
 * Reset the number of participants and conversions for this variant.
 */
Variant.prototype.resetCounts = function resetCounts(callback) {
    callback = callback || utils.noop;

    var self = this;
    var success = function () {
        self.participants = 0;
        self.conversions = 0;
        callback(null);
    }

    if (utils.isNew(this)) {
        success();
    } else {
        var sql = "UPDATE variants SET participants=0, conversions=0 WHERE id=?";

        db.query(sql, [this.id], function (err, result) {
            if (err) {
                callback(err);
            } else {
                success();
            }
        });
    }
}
