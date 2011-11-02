var path = require("path"),
    fs = require("fs"),
    errors = require("./errors"),
    Experiment = require("./experiment"),
    Variant = require("./variant"),
    Group = require("./group");

exports.configureFromFile = configureFromFile;
exports.configure = configure;
exports.score = score;

/**
 * Calls `configure` with the options in the given JSON file.
 */
function configureFromFile(file) {
    if (!path.existsSync(file)) {
        throw new errors.InvalidConfigurationError('File "' + file + '" does not exist');
    }

    var contents = fs.readFileSync(file, "utf8");

    try {
        var options = JSON.parse(contents);
    } catch (e) {
        throw new errors.InvalidConfigurationError('File "' + file + '" does not contain valid JSON', e);
    }

    configure(options);
}

/**
 * Configures the module with the given `options`, which should have the
 * following keys:
 *
 *   - groups
 *   - experiments
 */
function configure(options) {
    options = options || {};

    if ("groups" in options) {
        for (var name in options.groups) {
            Group.create(name, options.groups[name]);
        }
    }

    if ("experiments" in options) {
        for (var name in options.experiments) {
            Experiment.create(name, {variants: options.experiments[name]});
        }
    } else {
        throw new errors.InvalidConfigurationError("No experiments to configure");
    }
}

function score(conversion) {

}
