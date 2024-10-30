import express from "express";
import pool from "../../../utilities/database/db.mjs";
import {formatRevenueData} from "../../../utilities/transformations.mjs";

const router = express.Router();

router.get('/test', (req, res) => {
    res.send('Admin dashboard route working');
});

router.get('/revenue-past', async (req, res) => {
    try {
        const StoreID = req.user.StoreID;
        const query = 'CALL GetPastRevenueByStore(?)';

        const [rows] = await pool.query(query, [StoreID]);
        res.json(rows[0]); // Access the first element of rows since stored procedures return results as an array
    } catch (e) {
        console.error(e);
        res.status(500).json({error: 'Failed to fetch revenue data'});
    }
});


router.get('/order-statuses', async (req, res) => {
    try {
        const StoreID = req.user.StoreID;
        const query = 'CALL GetOrderStatusesByStore(?)';

        const [rows] = await pool.query(query, [StoreID]);
        console.log(`Fetched order statuses: ${JSON.stringify(rows[0])}`);
        res.json(rows[0]); // Access the first element of rows since stored procedures return results as an array
    } catch (e) {
        console.error(e); // Log the error for debugging
        res.status(500).json({error: 'Failed to fetch order statuses'});
    }
});


export default router;