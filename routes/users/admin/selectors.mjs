import express from "express";
import pool from "../../../utilities/database/db.mjs";

const router = express.Router();

router.get('/test', (req, res) => {
    res.send('Admin dashboard route working');
});


router.get('/today-trains', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetTodayTrains()');
        res.json(rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch trains today' });
    }
});


router.get('/available-years', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetAvailableYears()');
        console.log(`Fetched years: ${JSON.stringify(rows[0])}`);
        res.json(rows[0]); // Access the first element as CALL returns an array of arrays
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch available years' });
    }
});


router.get('/available-quarters/:year', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetAvailableQuarters(?)', [req.params.year]);
        console.log(`Fetched quarters for year ${req.params.year}: ${JSON.stringify(rows[0])}`);
        res.json(rows[0]); // Access the first element since CALL returns an array of arrays
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch available quarters' });
    }
});


router.get('/get-stores', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetStores()');
        res.json(rows[0]); // Access the first element since CALL returns an array of arrays
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch stores' });
    }
});


router.get('/product-categories', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetProductCategories()');
        res.json(rows[0]); // Access the first element since CALL returns an array of arrays
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to fetch product categories' });
    }
});



export default router;