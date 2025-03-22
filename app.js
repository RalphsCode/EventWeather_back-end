require('dotenv').config();
const express = require('express');     // npm i express
const axios = require('axios');         // npm i axios
const cors = require('cors');           // npm i cors
const app = express();

// Enable CORS for all routes
app.use(cors());

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



// FCC FIPS Route
app.get('/api/fips', async function (req, res){
  
  // Get the location FIPS code from the FCC website
    try {
      const {lat, lng} = req.query;
        const response = await axios.get(`https://geo.fcc.gov/api/census/block/find?format=json&latitude=${lat}&longitude=${lng}&showall=true`);
        const FIPS = response.data.County.FIPS;
        return res.send(FIPS);

    } catch (err) {
        console.log("Error in FIPS API data retrieval:", err);
        // Use a default FIPS for continuation: 06075 (San Francisco) or 06073 or 29510 (St. Louis)
        return res.send('06075');
    };
})   // END Fips Route



// NOAA NCDC WX Route
app.get('/api/noaa', async function (req, res){

  // Get the NOAA weather history for a single day
  try {
    const {date, FIPS} = req.query;
      const noaaToken = process.env.NOAA_token;
      const response = await axios.get(`https://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=GHCND&startdate=${date}&enddate=${date}&datatypeid=PRCP,TAVG&units=standard&limit=1000&locationid=FIPS:${FIPS}&includeStationLocation=True`,  {
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



// Start a server
app.listen(3001, function(){
    console.log("Server is running on port: 3001")
})