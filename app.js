const express = require('express');
const app = express();

app.get('/api/google', async function (req, res){
    try {
        const location = req.query.input;
        return res.send('On the server, received this location to search:', location)
    } catch (err) {
        console.log("Error:", err);
    }

})  // END route

// Start a server
app.listen(3001, function(){
    console.log("Server is running on port: 3001")
})