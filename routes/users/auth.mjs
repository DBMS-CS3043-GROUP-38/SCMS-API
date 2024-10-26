import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import pool from '../utilities/database/db.mjs'; // Adjust the path to your db.mjs file
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET;

// Signup Route
router.post('/signup', async (req, res) => {
    const { Username, Name, Address, Contact, Type, City, Password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(Password, 10);
        const sql = 'INSERT INTO customer (Username, Name, Address, Contact, Type, City, PasswordHash) VALUES (?, ?, ?, ?, ?, ?, ?)';
        await pool.execute(sql, [Username, Name, Address, Contact, Type, City, hashedPassword]);

        res.status(201).json({ message: 'Signup successful' });
    } catch (error) {
        res.status(500).json({ message: 'Error during signup', error });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { Username, Password } = req.body;

    try {
        const [rows] = await pool.execute('SELECT * FROM customer WHERE Username = ?', [Username]);
        if (rows.length === 0) return res.status(400).json({ message: 'Invalid credentials' });

        const user = rows[0];
        const isPasswordValid = await bcrypt.compare(Password, user.PasswordHash);
        if (!isPasswordValid) return res.status(400).json({ message: 'Invalid credentials' });

        // Create JWT token including Username
        const token = jwt.sign({ userId: user.CustomerID, Username: user.Username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ message: 'Error during login', error });
    }
});

// Middleware to protect routes
export const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ message: 'Access denied' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};

export default router;
