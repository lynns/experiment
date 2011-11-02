var mysql = require("mysql"),
    config = require("./config");

var client = mysql.createClient({
    user: config.DATABASE_USER,
    password: config.DATABASE_PASSWORD,
    database: config.DATABASE_NAME
});

client.on("error", function (err) {
    console.log("MySQL client error: " + err);
});

module.exports = client;
