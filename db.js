/** Database setup for event_weather. */

const { Client } = require("pg");

let DB_URI;

if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development") {
  DB_URI = process.env.DB_CONNECTION_STRING;
} else {
  DB_URI = process.env.DB_CONNECTION_STRING;
}

let db = new Client({
  connectionString: DB_URI
});

db.connect();

module.exports = db;