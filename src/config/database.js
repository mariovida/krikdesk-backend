const mysql = require("mysql2/promise");

let dbConfig;

if (process.env.ENVIRONMENT === 'production') {
  dbConfig = {
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_DB,
  };
} else {
  dbConfig = {
    host: process.env.TEST_DATABASE_HOST,
    user: process.env.TEST_DATABASE_USER,
    password: process.env.TEST_DATABASE_PASSWORD,
    database: process.env.TEST_DATABASE_DB,
  };
}

const db = mysql.createPool(dbConfig);

module.exports = db;