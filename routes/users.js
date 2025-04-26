/** User API routes:
 * (1) post user (/user)
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db');

// Write a User to the user table in DB
router.post('/user', async function (req, res) {
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


  module.exports = router;