/** Routes for the External API calls:
 * (1) Google Maps
 * (2) FCC ZipRef
 * (3) Solunar
 * (4) NOAA NCDC
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

// (1) Google Maps Route
router.get('/google', async function (req, res){
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



// (2) FCC ZipRef Route
router.get('/ZipRef', async function (req, res){
  
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



// (3) Solunar Route (https://sunrisesunset.io/api/)
router.get('/solunar', async function (req, res){

  function removeSeconds(timeString) {
    // Check if the input is a string.
    if (typeof timeString !== 'string') {
      return null;
    }
  
    // Use a regular expression to match the time format.
    const timeRegex = /^(\d{1,2}:\d{2}):\d{2} (AM|PM)$/i;
  
    // Test if the timeString matches the expected format.
    const match = timeString.match(timeRegex);
  
    if (!match) {
      return null; // Return null for invalid format
    }
  
    // Extract the hours and minutes from the first capturing group.
    const hoursAndMinutes = match[1];
    const ampm = match[2].toUpperCase(); // Ensure AM/PM is uppercase
  
    return `${hoursAndMinutes} ${ampm}`;
  } // END removeSeconds
  
  // Get the Sunrise and Sunset times 
    try {
      const {lat, lng, date} = req.query;
        const response = await axios.get(`https://api.sunrisesunset.io/json?lat=${lat}&lng=${lng}&date=${date}`);
        // Format the times to remove the seconds units from the time string
        const sunriseFullTime = response.data.results.sunrise;
        const sunsetFullTime = response.data.results.sunset;
        const sunrise = removeSeconds(sunriseFullTime);
        const sunset = removeSeconds(sunsetFullTime);
        
        const solunar = {"sunrise":sunrise,"sunset":sunset};
        return res.json(solunar);

    } catch (err) {
        console.log("Error in the Sunrise/Sunset API data retrieval:", err);
        return res.send('12:00');
    };
})   // END solunar Route


// (4) NOAA NCDC WX Route
router.get('/noaa', async function (req, res){

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


module.exports = router;