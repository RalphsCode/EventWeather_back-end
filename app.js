/** Backend for the EVENT WEATHER app.
 * Starts a SERVER.
 * Contains RESTful API routes for:
 *  /api/google - Google Maps for location info
 *      returns the location data
 *  /api/ZipRef - FCC for ZipRef code
 *      returns the 5 digit ZipRef code for the location.
 *  /api/solunar - sunrisesunset.io for Sunrise & Sunset
 *      returns the Sunrise and Sunset times for the location.
 *  /api/noaa - NOAA for daily weather history data
 *      returns the weather history for a ZipRef for a particular day.
 *  /api/user - writes a user profile to the users table in the DB
 *      returns user_id from users table.
 *  /api/search - Write search info to searches table, & wx_data table in DB
 *      returns the search_id from searches table.
 */


const express = require('express');     // npm i express      // npm i axios
const cors = require('cors');           // npm i cors
const app = express();
require('dotenv').config();

// Enable CORS for all routes
app.use(cors());

// Add Express JSON body parser middleware to parse the incoming JSON data
app.use(express.json());

// Use Express Router
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const searchRoutes = require("./routes/searches");
const externalAPIRoutes = require("./routes/external-api");

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/searches", searchRoutes);
app.use("/API", externalAPIRoutes);


module.exports = app;