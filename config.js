const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    saltRounds: process.env.SALT_ROUNDS,
    secretKey: process.env.SECRET_KEY,
};