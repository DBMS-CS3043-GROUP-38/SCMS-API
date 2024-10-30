import express from "express";
import pool from "../../../utilities/database/db.mjs";
import {formatRevenueData} from "../../../utilities/transformations.mjs";

const router = express.Router();

router.get('/test', (req, res) => {
    res.send('Admin dashboard route working');
});

router.get('/revenue-past', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetPastRevenueByQuarter()');
        res.json(rows[0]);  // Access the result from the stored procedure
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch revenue data' });
    }
});


router.get('/order-statuses', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetOrderStatusesCount()');
        console.log(`Fetched order statuses: ${JSON.stringify(rows[0])}`);
        res.json(rows[0]);  // Access the result from the stored procedure
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch order statuses' });
    }
});


router.get('/revenue-past-month', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetPastMonthRevenue()');
        console.log(`Fetched monthly revenue data: ${rows[0].length} rows`);
        res.json(rows[0]);  // Access the result from the stored procedure
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch monthly revenue data' });
    }
});


router.get('/revenue-per-store/:year/:quarter', async (req, res) => {
    const { year, quarter } = req.params;
    try {
        const [rows] = await pool.query('CALL GetRevenuePerStore(?, ?)', [year, quarter]);
        console.log(`Fetched revenue per store data: ${rows[0].length} rows`);
        res.json(rows[0]);  // Access the result from the stored procedure
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch revenue per store data' });
    }
});


router.get('/customer-distribution', async (req, res) => {
    try {
        const customers = { "End": 0, "Retailer": 0 };
        const [rows] = await pool.query('CALL GetCustomerDistribution()');

        rows[0].forEach(row => {
            customers[row.Type] = row.count;
        });

        console.log(`Fetched customer distribution: ${JSON.stringify(customers)}`);
        res.json(customers);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch customer distribution' });
    }
});


router.get('/route-sales/:storeID', async (req, res) => {
    try {
        const { storeID } = req.params;
        const [rows] = await pool.query('CALL GetRouteSalesByStore(?)', [storeID]);

        console.log(`Fetched route sales: ${rows[0].length} rows`);
        res.json(rows[0]);  // rows[0] contains the result set from the stored procedure
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch route sales' });
    }
});


export default router;