import express from 'express';
import db from '../../../utilities/database/db.mjs';

const router = express.Router();

// Route to get routes based on city using a stored procedure
router.get('/', async (req, res) => {
    const { city } = req.query;

    // Check if city parameter is provided
    if (!city) {
        return res.status(400).json({ message: 'City parameter is required.' });
    }

    try {
        // Call the stored procedure with the provided city
        const [routes] = await db.query('CALL GetRoutesByCity(?)', [city]);

        // Send response with fetched routes
        res.json(routes[0]); // routes[0] contains the result set
    } catch (error) {
        console.error('Error fetching routes:', error);
        res.status(500).json({ message: 'Failed to fetch routes.' });
    }
});

export default router;
