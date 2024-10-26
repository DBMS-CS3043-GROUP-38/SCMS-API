import express from 'express';
import db from '../../../utilities/database/db.mjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log("Authorization Header:", authHeader); // Debugging: Check if header exists

  const token = authHeader?.split(' ')[1];
  console.log("Extracted Token:", token); // Debugging: Check if token is extracted

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("Token verification failed:", err); // Debugging: Log any verification errors
      return res.status(401).json({ message: 'Unauthorized!' });
    }
    req.userId = decoded.id; // Assuming user ID is stored in the token payload
    next();
  });
};

// GET route to fetch user profile
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM customer WHERE CustomerID = ?', [req.userId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(rows[0]); // Return the user profile data
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Error fetching user data', error: error.message });
  }
});

export default router;
