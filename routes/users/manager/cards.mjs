import express from "express";
import pool from "../../../utilities/database/db.mjs";

const router = express.Router();

router.get('/test', (req, res) => {
    res.send('Admin dashboard route working');
});

router.get('/quarterly-sales', async (req, res) => {
    try {
        const storeID = req.user.StoreID; // Assuming you have a middleware to set req.user
        const [rows] = await pool.query('CALL GetQuarterlySalesByStore(?)', [storeID]);

        if (rows[0].length < 2) {
            return res.status(404).json({ error: 'Not enough data available for the requested store' });
        }

        const data = {
            current: rows[0][0].TotalRevenue,   // First row for current quarter
            previous: rows[0][1].TotalRevenue    // Second row for previous quarter
        };

        res.json(data);
        console.log(`Quarterly sales data fetched: ${JSON.stringify(data)} for the card`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch quarterly sales' });
    }
});


router.get('/trains-completed', async (req, res) => {
    try {
        const storeID = req.user.StoreID; // Assuming req.user is populated by your authentication middleware
        const [rows] = await pool.query('CALL GetCompletedTrainsByStore(?)', [storeID]);

        const completed = rows[0][0].completed || 0; // First row, first column
        const total = rows[0][0].total || 0;         // First row, second column

        res.json({ completed, total });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch trains completed' });
    }
});


router.get('/train-statuses', async (req, res) => {
    try {
        const storeID = req.user.StoreID; // Assuming req.user is populated by your authentication middleware
        const [rows] = await pool.query('CALL GetTrainStatusesByStore(?)', [storeID]);

        res.json(rows[0]); // Access the first row of results from the stored procedure
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch train statuses' });
    }
});



router.get('/shipment-statuses', async (req, res) => {
    try {
        const storeID = req.user.StoreID; // Assuming req.user is populated by your authentication middleware
        const [rows] = await pool.query('CALL GetShipmentStatusesByStore(?)', [storeID]);

        res.json(rows[0]); // Access the first row of results from the stored procedure
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch shipment statuses' });
    }
});


router.get('/quarterly-orders', async (req, res) => {
    const storeID = req.user.StoreID; // Assuming req.user is populated by your authentication middleware
    try {
        const [rows] = await pool.query('CALL GetQuarterlyOrdersByStore(?)', [storeID]);

        const data = {
            current: rows[0][0]?.TotalOrders || 0, // Safely access TotalOrders
            previous: rows[0][1]?.TotalOrders || 0 // Safely access TotalOrders
        };

        res.json(data);
        console.log(`Quarterly orders data fetched: ${data} for the card`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch quarterly orders' });
    }
});


router.get('/quarterly-store', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetTopQuarterlyStoreData()');
        res.json(rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch quarterly store data' });
    }
});

router.get('/best-customer', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetBestCustomerForCurrentQuarter()');
        res.json(rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch best customer data' });
    }
});

router.get('/get-ready-shipments/:storeID', async (req, res) => {
    try {
        const storeID = req.params.storeID;
        console.log(`Fetching ready shipments for store ${storeID}`);

        const [rows] = await pool.query('CALL GetReadyShipmentsByStore(?)', [storeID]);
        const shipment = { 'Ready': 0, 'NotReady': 0 };

        rows[0].forEach(row => {
            shipment[row.Status] = row.shipmentCount;
        });

        console.log(`Fetched ready shipments: ${JSON.stringify(shipment)}`);
        res.json(shipment);
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: 'Failed to fetch ready shipments' });
    }
});


router.get('/get-available-assistants', async (req, res) => {
    try {
        console.log(`Fetching available assistants for store ${req.user.StoreID}`);
        const assistants = { "Available": 0, "Busy": 0 };

        const [rows] = await pool.query('CALL GetAvailableAssistantsByStore(?)', [req.user.StoreID]);

        // Process the result to populate the assistants object
        rows[0].forEach(row => {
            assistants[row.Status] = row.count;
        });

        console.log(`Fetched available assistants: ${JSON.stringify(assistants)}`);
        res.json(assistants);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch available assistants' });
    }
});

router.get('/get-available-drivers', async (req, res) => {
    try {
        console.log(`Fetching available drivers for store ${req.user.StoreID}`);
        const drivers = { "Available": 0, "Busy": 0 };

        const [rows] = await pool.query('CALL GetAvailableDriversByStore(?)', [req.user.StoreID]);

        // Process the result to populate the drivers object
        rows[0].forEach(row => {
            drivers[row.Status] = row.count;
        });

        console.log(`Fetched available drivers: ${JSON.stringify(drivers)}`);
        res.json(drivers);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch available drivers' });
    }
});

router.get('/get-available-trucks', async (req, res) => {
    try {
        console.log(`Fetching available trucks for store ${req.user.StoreID}`);
        const trucks = { "Available": 0, "Busy": 0 };

        const [rows] = await pool.query('CALL GetAvailableTrucksByStore(?)', [req.user.StoreID]);

        // Process the result to populate the trucks object
        rows[0].forEach(row => {
            trucks[row.Status] = row.count;
        });

        console.log(`Fetched available trucks: ${JSON.stringify(trucks)}`);
        res.json(trucks);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch available trucks' });
    }
});


router.get('/truck-schedule-statuses', async (req, res) => {
    try {
        const storeID = req.user.StoreID;
        const query = 'CALL GetTruckScheduleStatusesByStore(?)';

        const [rows] = await pool.query(query, [storeID]);
        res.json(rows[0]); // Access the first element of rows since stored procedures return results as an array
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: 'Failed to fetch truck schedule statuses' });
    }
});


export default router;