const {
    host,
    user,
    password,
    database
} = require("./config");

module.exports = {
    client: "mysql",
    connection: {
        host: host,
        user: user,
        password: password,
        database: database,
    },
};