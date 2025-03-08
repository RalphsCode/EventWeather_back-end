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


// Start a server
app.listen(3001, function(){
    console.log("Server is running on port: 3001")
})