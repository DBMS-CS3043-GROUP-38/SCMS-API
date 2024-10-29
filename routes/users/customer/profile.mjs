// profileRoute.js
import express from 'express';
import db from '../../../utilities/database/db.mjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized!' });
    }
    req.userId = decoded.userId; // Use the userId field stored in the token payload
    next();
  });
};

// GET route to fetch user profile using stored procedure
router.get('/', verifyToken, async (req, res) => {
  try {
    // Call the stored procedure using db.query with the CALL syntax
    const [rows] = await db.query('CALL GetCustomerReport(?)', [req.userId]);
    
    if (rows[0].length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(rows[0][0]); // Return the user profile data from the stored procedure
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Error fetching user data', error: error.message });
  }
});

export default router;
