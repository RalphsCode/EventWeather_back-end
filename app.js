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

require('dotenv').config();
const express = require('express');     // npm i express
const axios = require('axios');         // npm i axios
const cors = require('cors');           // npm i cors
const app = express();
const db = require('./db');

// Enable CORS for all routes
app.use(cors());

// Add Express JSON body parser middleware to parse the incoming JSON data
app.use(express.json());

// Google Maps Route
app.get('/api/google', async function (req, res){
    try {
        // Get the url string paramater
        const location = req.query.input;
        if (!location) {
            return res.status(400).json({ error: "Missing Location" });
          }
          
          // get the API key from .env
          const keyString = process.env.GOOGLE_KEY;
          if (!keyString) {
            return res.status(500).json({ error: "API key not configured" });
        }

          // Make the API call
          const response = await axios.get(
            `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${location}&key=${keyString}`
          );
          
          // Separate out the needed data
          const result = response.data.results[0];
          const locationData =  {
                    location: result.name,
                    formattedAddress: result.formatted_address,
                    lat: result.geometry.location.lat,
                    lng: result.geometry.location.lng
                };

          // Return the response data to the client
          return res.json(locationData);

    } catch (err) {
        console.log("Error:", err);
        return res.status(500).send("Server error");
    }

})  // END route



// FCC ZipRef Route
app.get('/api/ZipRef', async function (req, res){
  
  // Get the location ZipRef code from the FCC website
    try {
      const {lat, lng} = req.query;
        const response = await axios.get(`https://geo.fcc.gov/api/census/block/find?format=json&latitude=${lat}&longitude=${lng}&showall=true`);
        const ZipRef = response.data.County.FIPS;
        return res.send(ZipRef);

    } catch (err) {
        console.log("Error in ZipRef API data retrieval:", err);
        // Use a default ZipRef for continuation: 06075 (San Francisco) or 06073 or 29510 (St. Louis)
        return res.send('06075');
    };
})   // END ZipRef Route



// Solunar Route (https://sunrisesunset.io/api/)
app.get('/api/solunar', async function (req, res){
  
  // Get the Sunrise and Sunset times 
    try {
      const {lat, lng, date} = req.query;
        const response = await axios.get(`https://api.sunrisesunset.io/json?lat=${lat}&lng=${lng}&date=${date}`);
        const sunrise = response.data.results.sunrise;
        const sunset = response.data.results.sunset;
        const solunar = {"sunrise":sunrise,"sunset":sunset};
        return res.json(solunar);

    } catch (err) {
        console.log("Error in the Sunrise/Sunset API data retrieval:", err);
        return res.send('12:00');
    };
})   // END solunar Route


// NOAA NCDC WX Route
app.get('/api/noaa', async function (req, res){

  // Get the NOAA weather history for a single day
  try {
    const {date, ZipRef} = req.query;
      const noaaToken = process.env.NOAA_token;
      const response = await axios.get(`https://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=GHCND&startdate=${date}&enddate=${date}&datatypeid=PRCP,TAVG&units=standard&limit=1000&locationid=FIPS:${ZipRef}&includeStationLocation=True`,  {
          headers: {
              'token': noaaToken
          }
      });
      const pointWX = response.data.results;
      return res.json(pointWX);
  } catch (err) {
      console.log("Error in NCDC NOAA API data retrieval:", err);
  }
})  // END NOAA Route


// Write a User to the user table in DB
app.post('/api/user', async function (req, res) {
  try { 
    const { username, f_name, l_name, user_email, user_pword } = req.body; 
    const result = await db.query( 
    `INSERT INTO users (username, f_name, l_name, user_email, user_pword) 
    VALUES ($1, $2, $3, $4, $5) 
    RETURNING user_id`,	// Return data will be in rows
    [username, f_name, l_name, user_email, user_pword] 
  ); 	// the parameters $1, $2, $3
    return res.json(result.rows[0]); 	// return only first row
    } catch (err) { 
      res.status(400).json({ error: err.message }); 
  }
})    // END User post Route


// Write search to searches table, & wx_data table, in DB
app.post('/api/search', async function (req, res) {
  try { 
    const { 
      user_id, evt_location_ent, evt_location_act, 
      evt_date, evt_desc, num_years, ZipRef, rain_prcnt, exp_temp, max_temp, min_temp, sunrise, sunset,
      // Weather data parameters
      weatherResults 
    } = req.body; 
    const ip_addr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // First, insert user, event, & prediction data
    const searchResult = await db.query( 
      `INSERT INTO searches (user_id, ip_addr, evt_location_ent, evt_location_act, evt_date, evt_desc, num_years, ZipRef, rain_prcnt, exp_temp, max_temp, min_temp, sunrise, sunset) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
      RETURNING search_id`,
      [user_id, ip_addr, evt_location_ent, evt_location_act, evt_date, evt_desc, num_years, ZipRef, rain_prcnt, exp_temp, max_temp, min_temp, sunrise, sunset]
    );
    
    // Create the search_id value to use in weather data
    const search_id = searchResult.rows[0].search_id;
    
    // Loop through the weather resutls
    // First loop over the array of daily objects
    // Then extract the daily object & write to DB
    for (const daily_data of weatherResults) {
        const wx_date = Object.keys(daily_data)[0];

        const values = daily_data[wx_date];
        const record_count = values.records;
        const rain = values.rain;
        const temp = values.temp;
        const max_temp = values.maxTemp;
        const min_temp = values.minTemp;
      
        // Send the weather data to the database
        const weatherResult = await db.query(
          `INSERT INTO wx_data (search_id, wx_date, record_count, prcp, tavg, tmax, tmin) 
          VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [search_id, wx_date, record_count, rain, temp, max_temp, min_temp]
        );
    }  // END for loop...
    
    // Return the search_id
    return res.status(200).json({search_id: search_id });
  } catch (err) { 
    console.error(err);
    res.status(400).json({ error: err.message }); 
  }
});  // END data post Route


// *****************************************************

// Start a server
app.listen(3001, function(){
    console.log("Server is running on port: 3001")
})

// *****************************************************
