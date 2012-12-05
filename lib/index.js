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
exports.readFor = readFor;

exports.select = select;
exports.protect = protect;
exports.feature = feature;
exports.log = log;
exports.variantFor = variantFor;

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
    var envVarName = options.DEPLOYMENT_ENV_VARIABLE || 'TARGET_ENV',
        targetEnv = process.env[envVarName] || null;
          
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
    
    //override experiment settings using targetEnv if needed
    if(targetEnv && options.envs && options.envs[targetEnv]) { //do the override
      var overrides = options.envs[targetEnv];
      
      for(var key in overrides) {
        options.experiments[key] = overrides[key];
      }
    }

    var experiment, experimentConfig, variant, variantConfig, config, match, group;
    for (var experimentName in options.experiments) {
        if (!experimentName.match(/^[a-zA-Z][a-zA-Z0-9]*$/)) {
            throw new errors.InvalidConfigurationError("Experiment named '" + experimentName + "' must start with an ASCII letter and contain only ASCII letters and numbers.");
        }
        
        experiment = new Experiment(experimentName);
        experimentConfig = options.experiments[experimentName];

        if (typeof experimentConfig === "string" || typeof experimentConfig === 'boolean') {
            // the name of a group, a boolean, or a percentage of users
            experimentConfig = [experimentConfig];
        }

        if (Array.isArray(experimentConfig)) {
            // array of group name(s) and/or a percentage of users
            experimentConfig = {"default": experimentConfig};
        }

        for (var variantName in experimentConfig) {
            if (!variantName.match(/^[a-zA-Z][a-zA-Z0-9]*$/)) {
                throw new errors.InvalidConfigurationError("Variant named '" + experimentName + "/" + variantName + "' must start with an ASCII letter and contain only ASCII letters and numbers.");
            }
            variant = new Variant(variantName);
            variantConfig = experimentConfig[variantName];

            if (!Array.isArray(variantConfig)) {
                // the name of a group, a boolean, or a percentage of users
                variantConfig = [variantConfig];
            }

            for (var i = 0, len = variantConfig.length; i < len; ++i) {
                config = variantConfig[i];

                match = (/^(?:(\d{1,3})-)?(\d{1,3})%$/).exec(config);

                if (match) {
                    // percentage of users
                    variant.setPercentage(match[1], match[2]);
                } else if (typeof config === 'boolean') {
                    if(i===0)
                        variant.setIsOn(config);
                    else
                        throw new errors.InvalidConfigurationError("Variant values cannot be booleans.");
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
 * Returns a snapshot of what experiments/variants are on/off for the given context.
 * The `exps` is an optional param that contains the current state of the experiments for the given context.
 * If 'exps' is provided, it's current state will be updated based on the given context object with respect to
 * any dirtyFeature flags.
 */
function readFor(context, exps) {
    return Experiment.forContext(context, exps);
}

/**
 * Returns a new Context for the optional `sessionId` and for the optional user with the given `userId`.
 */
function contextFor(sessionId, userId) {
    return new Context(sessionId, userId);
}

/**
 * Select the callback from `callbacks` to use for the given feature (and
 * optionally variant) `name` in the given `exps` object. See protect.
 */
function select(name, exps, callbacks) {
    var split = name.split("/");
    var experimentName = split[0];
    var variantName = split[1];

    var activeVariant = variantFor(experimentName, exps);
    
    if(activeVariant) { 
      if(typeof callbacks === "function" && (!variantName || activeVariant === variantName)) {
        return callbacks;
      }
      
      if(variantName) { //specified a variant explicitly
        if(variantName === activeVariant && (activeVariant in callbacks)) {
          return callbacks[activeVariant];
        }
      }
      else if(activeVariant in callbacks) {
        return callbacks[activeVariant];
      }
    }
    
    return callbacks["fallback"] || null; //no active variant or no matching callback so use fallback if there is one
}

/**
 * Calls the callback from `callbacks` for the given experiment (and optionally
 * variant) `name` in the given `exps` object.
 *
 *   protect("feature one", exps, function () {
 *       // Runs if "feature one" is true.
 *   });
 *
 *   protect("feature one/variant one", exps, function () {
 *       // Runs if "feature one", "variant one" is true.
 *   });
 *
 *   protect("feature one", exps, {
 *       "variant one": function () {
 *           // Runs if "variant one" is true.
 *       },
 *       "variant two": function () {
 *           // Runs if "variant two" is true.
 *       }
 *   });
 *
 * Any additional arguments passed to this function are passed along to the
 * callback.
 */
function protect(name, exps, callbacks) {
    // TODO: if callbacks is a function, execute it...hmmm can't; how do we know?
    // TODO: Memoize callbacks list for future use
    var callback = select(name, exps, callbacks);

    if (callback) {
        var args = Array.prototype.slice.call(arguments, 3);
        return callback.apply(null, args);
    }

    return null;
}

/**
 * Returns the name of the variant that is active for this feature, or false if none are active.
 */
function feature(name, exps) {
    return variantFor(name, exps);
}

/**
 * A basic logging function that may be used to emit warnings and other log
 * data. May be overridden if custom logging functionality is desired.
 */
function log(message) {
    console.log(message);
}

/**
 * Returns the Variant that should be used for this experiment in the given
 * `exps` object, if any.
 */
function variantFor(name, exps) {
    var result = exps.features[name];
    
    if(typeof result === 'boolean') {
      return result;
    }

    for(var vName in result) {
      if(result[vName]) {
        return vName;
      }
    }
    
    return false;
}
