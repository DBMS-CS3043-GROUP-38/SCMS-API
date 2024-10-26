import express from 'express';
import db from '../../../utilities/database/db.mjs';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT DISTINCT City FROM store');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({ message: 'Failed to fetch cities.' });
    }
});

export default router;
