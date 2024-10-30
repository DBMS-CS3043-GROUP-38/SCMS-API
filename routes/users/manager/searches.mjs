import express from "express";
import pool from "../../../utilities/database/db.mjs";


const router = express.Router();

router.get('/test', (req, res) => {
    res.send('Admin dashboard route working');
});

router.get('/order/:id', async (req, res) => {
    try {
        const StoreID = req.user.StoreID;  // Get StoreID from authenticated user
        const id = req.params.id;            // Get the order ID from the request parameters

        if (!id) {
            return res.status(400).json({error: 'Order ID not provided'});
        }

        // Call the stored procedure to get order details
        const query = 'CALL GetOrderDetails(?)';
        const [rows] = await pool.query(query, [id]);

        // Check if any row is returned
        if (rows[0].length === 0) {
            return res.status(404).json({error: 'Order not found'});
        }

        // Verify that the fetched order belongs to the user's StoreID
        const order = rows[0][0];  // Get the first result from the stored procedure
        if (order['Store ID'] !== StoreID) {
            return res.status(403).json({error: 'You do not have access to this order'});
        }

        // Return the order details if the StoreID matches
        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Failed to fetch orders'});
    }
});

export default router;