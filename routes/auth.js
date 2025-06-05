const express = require('express');
const router = express.Router();
const axios = require('axios');
const bcrypt = require("bcrypt");
const db = require('../db');

router.post('/register', async (req, res, next) => {
    try {
        const {username, email, password} = req.body;
        // Check that all three fields have been provided and are not whitespace
        if (!username?.trim() || !email?.trim() || !password?.trim()) {
            return res.status(400).json({ error: "Username, email, and password are required" });
        }

        //Check if the username is available
        const checkUsername = await db.query( 
        `SELECT * FROM users
        WHERE username = $1;`, [username]
        );
        const usernameResult = checkUsername.rows[0];
        console.log("usernameResult from username exists check:", usernameResult);
        if (usernameResult) {
            return res.status(400).json({username: "UNAVAILABLE" });
        }

        // Hash the password
        const hashedPW = await bcrypt.hash(password, 12);

        // Write the username, email, and hashed pw to the database
        const writeUserToDB = await db.query( 
            `INSERT INTO users (username, user_email, user_pword)
            VALUES ($1, $2, $3)
            RETURNING username;`, 
            [username, email, hashedPW]
            );
        return res.status(200).json(writeUserToDB.rows);

    } catch(e) {
        console.error("Error registering user:", e); 
        // Log the error for debugging
        res.status(500).json({
            success: false,
            message: `ERROR registering user: ${e.message || e}`
        });
    }
})

module.exports = router;