var fs = require("fs"),
    path = require("path"),
    errors = require("./errors"),
    Group = require("./group"),
    Experiment = require("./experiment"),
    Variant = require("./variant"),
    Context = require("./context");

exports.configureFromFile = configureFromFile;
exports.configure = configure;
exports.contextFor = contextFor;
exports.select = select;
exports.protect = protect;
exports.log = log;

/**
 * Calls `configure` with the options in the given JSON `file`.
 */
function configureFromFile(file) {
    if (!path.existsSync(file)) {
        throw new errors.InvalidConfigurationError('File "' + file + '" does not exist');
    }

    var contents = fs.readFileSync(file, "utf8");

    try {
        var options = JSON.parse(contents);
    } catch (err) {
        throw new errors.InvalidConfigurationError('File "' + file + '" does not contain valid JSON', err);
    }

    configure(options);
}

/**
 * Configures the module with the given `options`, which should have the
 * following keys:
 *
 *   - groups
 *   - experiments
 *
 * See README.md for more information.
 */
function configure(options) {
    options = options || {};

    if ("groups" in options) {
        var group, groupConfig, config, match;
        for (var groupName in options.groups) {
            group = new Group(groupName);
            groupConfig = options.groups[groupName];

            if (typeof groupConfig == "string") {
                // user id or percentage of users
                groupConfig = [groupConfig];
            }

            for (var i = 0, len = groupConfig.length; i < len; ++i) {
                config = groupConfig[i];
                match = (/^(?:(\d{1,3})-)?(\d{1,3})%$/).exec(config);

                if (match) {
                    // percentage of users
                    group.setPercentage(match[1], match[2]);
                } else {
                    // user id
                    group.addUser(config);
                }
            }
        }
    }

    if (!("experiments" in options)) {
        throw new errors.InvalidConfigurationError("No experiments to configure");
    }

    var experiment, experimentConfig, variant, variantConfig, config, match, group;
    for (var experimentName in options.experiments) {
        experiment = new Experiment(experimentName);
        experimentConfig = options.experiments[experimentName];

        if (typeof experimentConfig == "string") {
            // the name of a group or a percentage of users
            experimentConfig = [experimentConfig];
        }

        if (Array.isArray(experimentConfig)) {
            // array of group name(s) and/or a percentage of users
            experimentConfig = {"default": experimentConfig};
        }

        for (var variantName in experimentConfig) {
            variant = new Variant(variantName);
            variantConfig = experimentConfig[variantName];

            if (typeof variantConfig == "string") {
                // the name of a group or a percentage of users
                variantConfig = [variantConfig];
            }

            for (var i = 0, len = variantConfig.length; i < len; ++i) {
                config = variantConfig[i];

                // The special value "everyone" is an alias for "100%".
                if (config == "everyone") {
                    config = "100%";
                }

                match = (/^(?:(\d{1,3})-)?(\d{1,3})%$/).exec(config);

                if (match) {
                    // percentage of users
                    variant.setPercentage(match[1], match[2]);
                } else {
                    // group name
                    group = Group.byName(config);

                    if (group) {
                        variant.addGroup(group);
                    } else {
                        throw new errors.InvalidConfigurationError('No group named "' +
                            config + '" for experiment ' + [experimentName, variantName].join("/"));
                    }
                }
            }

            experiment.addVariant(variant);
        }
    }
}

/**
 * Returns a new Context for the user with the given `userId`.
 */
function contextFor(userId) {
    return new Context(userId);
}

/**
 * Select the callback from `callbacks` to use for the given experiment (and
 * optionally variant) `name` in the given `context`. See protect.
 */
function select(name, context, callbacks) {
    var split = name.split("/");
    var experimentName = split[0];
    var variantName = split[1];

    var experiment = Experiment.byName(experimentName);

    // Return if there is no experiment with the given name.
    if (!experiment) {
        exports.log('WARNING: Undefined experiment "' + experimentName + '" was used.');
        return null;
    }

    // If a plain function is given as the `callbacks` argument, it is used as
    // the callback for the variant named `variantName`.
    if (typeof callbacks == "function") {
        var tmp = callbacks;
        callbacks = {};
        callbacks[variantName || "default"] = tmp;
    }

    var variant = context.variant(experiment);

    // Return if there is no variant or there is no callback for the variant.
    if (!variant || !(variant.name in callbacks)) {
        return null;
    }

    // If the variant name was explicitly provided in the `name` argument, it
    // MUST match the name of the variant being used.
    if (variantName && variant.name != variantName) {
        return null;
    }

    return callbacks[variant.name];
}

/**
 * Calls the callback from `callbacks` for the given experiment (and optionally
 * variant) `name` in the given `context`.
 *
 *   protect("feature one", context, function () {
 *       // Runs if the user in the context is part of "feature one".
 *   });
 *
 *   protect("feature one/variant one", context, function () {
 *       // Runs if the user in the context is part of "feature one", "variant one".
 *   });
 *
 *   protect("feature one", context, {
 *       "variant one": function () {
 *           // Runs if the user in the context is part of "feature one", "variant one".
 *       },
 *       "variant two": function () {
 *           // Runs if the user in the context is part of "feature one", "variant two".
 *       }
 *   });
 *
 * Any additional arguments passed to this function are passed along to the
 * callback.
 */
function protect(name, context, callbacks) {
    var callback = select(name, context, callbacks);

    if (callback) {
        var args = Array.prototype.slice.call(arguments, 3);
        return callback.apply(null, args);
    }

    return null;
}

/**
 * A basic logging function that may be used to emit warnings and other log
 * data. May be overridden if custom logging functionality is desired.
 */
function log(message) {
    console.log(message);
}
