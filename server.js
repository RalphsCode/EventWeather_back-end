// File that creates & starts a local server for the Aoo.

const app = require('./app');     // npm i express

// Start a server
app.listen(3001, function(){
    console.log("Server is running on port: 3001")
})

// *****************************************************