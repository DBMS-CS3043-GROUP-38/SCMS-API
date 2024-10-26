// backend/displayItems.mjs

import express from 'express';
import db from '../../../utilities/database/db.mjs'; // Correct the path to db.mjs

const router = express.Router();

// GET endpoint to retrieve products by category
router.get('/products/Type/:type', async (req, res) => {
    const productCategory = req.params.type; // Get the category from the request URL

    try {
        // Query the database for products in the specified category
        const [results] = await db.query('SELECT * FROM product WHERE Type = ?', [productCategory]);

        if (results.length === 0) {
            return res.status(404).json({ message: `No products found for category: ${productCategory}.` });
        }

        res.json(results); // Return the products
    } catch (error) {
        console.error('Database query error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Export the router to be used in your main app
export default router;
