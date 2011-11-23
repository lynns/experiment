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

function select(name, context, callbacks) {
    var split = name.split("/");
    var experimentName = split[0];
    var variantName = split[1] || "default";

    var experiment = Experiment.byName(experimentName);

    if (!experiment) {
        throw new errors.UnknownExperimentError(experimentName);
    }

    // If a plain function is given it is used for the variant specified in
    // `name`, after the slash.
    if (typeof callbacks == "function") {
        var tmp = callbacks;
        callbacks = {};
        callbacks[variantName] = tmp;
    }

    var variant = context.variant(experiment);

    if (!variant || !(variant.name in callbacks)) {
        return null;
    }

    return callbacks[variant.name];
}

function protect(name, context, callbacks) {
    var callback = select(name, context, callbacks);

    if (callback) {
        var args = Array.prototype.slice.call(arguments, 3);
        return callback.apply(null, args);
    }

    return null;
}
