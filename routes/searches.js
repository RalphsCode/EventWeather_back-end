/**
 * Sending and receiving data from the searches and wx_data tables in the db.
 * (1) post - send the search details to searches and wx_data tables.
 * (2) get - Get the Users last 5 searches
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// Write search to searches table & wx_data table, in DB
router.post('/', async function (req, res) {
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
  });  // END data POSt Route
  

  // Get Users last 5 searches
  router.get('/userHistory', async function (req, res) {
    try {
      const user_id = req.query.user_id;
      if (!user_id) {
        return res.status(401).json({error: "User must be logged in."});
      } // END if...
      const results = await db.query(
        `SELECT 
          evt_location_act, 
          evt_date, 
          num_years,  
          rain_prcnt,
          exp_temp,
          max_temp,
          min_temp,
          sunrise,
          sunset 
        FROM searches 
        WHERE user_id = $1
        ORDER BY date_time_utc DESC
        LIMIT 5;
        `, [user_id]
      );
      return res.status(200).json(results.rows);
    } catch (err) {
      console.log("ERROR in getting the search history data:", err);
      return res.status(500).json({error: "Server error retrieving history"});
    }
  })  // END history GET Route

  module.exports = router;