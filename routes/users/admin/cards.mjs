import express from "express";
import pool from "../../../utilities/database/db.mjs";

const router = express.Router();

router.get('/test', (req, res) => {
    res.send('Admin dashboard route working');
});

router.get('/quarterly-sales', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetQuarterlySales()');
        const data = {
            current: rows[0][0].TotalRevenue,
            previous: rows[0][1].TotalRevenue
        };

        res.json(data);
        console.log(`Quarterly sales data fetched: ${data} for the card`);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch quarterly sales' });
    }
});


router.get('/trains-completed', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetTrainsCompletedToday()');
        const completed = rows[0][0].completed || 0;
        const total = rows[0][0].total || 0;

        res.json({ completed, total });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch trains completed' });
    }
});


router.get('/pending-orders', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetPendingOrdersCount()');
        const pending = rows[0][0].pending || 0;

        res.json({ pending });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch pending orders' });
    }
});


router.get('/orders-attention', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetAttentionOrdersCount()');
        const attention = rows[0][0].attention || 0;

        res.json({ attention });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch orders needing attention' });
    }
});


router.get('/today-sales', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetTodaySales()');
        const data = {
            current: rows[0][0].TotalRevenue,
            previous: rows[0][1].TotalRevenue
        };

        res.json(data);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch today sales' });
    }
});


router.get('/train-statuses', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetTrainStatusesCount()');
        res.json(rows[0]);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch train statuses' });
    }
});


router.get('/quarterly-orders', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetQuarterlyOrdersCount()');
        const data = {
            current: rows[0][0].TotalOrders,
            previous: rows[0][1].TotalOrders
        };

        res.json(data);
        console.log(`Quarterly orders data fetched: ${data} for the card`);
    } catch (error) {
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




router.get('/get-available-assistants/:storeID', async (req, res) => {
    try {
        const storeID = req.params.storeID;
        console.log(`Fetching available assistants for store ${storeID}`);

        const [rows] = await pool.query('CALL GetAvailableAssistantsByStore(?)', [storeID]);
        const assistants = { "Available": 0, "Busy": 0 };

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


router.get('/get-available-drivers/:storeID', async (req, res) => {
    try {
        const storeID = req.params.storeID;
        console.log(`Fetching available drivers for store ${storeID}`);

        const [rows] = await pool.query('CALL GetAvailableDriversByStore(?)', [storeID]);
        const drivers = { "Available": 0, "Busy": 0 };

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


router.get('/get-available-trucks/:storeID', async (req, res) => {
    try {
        const storeID = req.params.storeID;
        console.log(`Fetching available trucks for store ${storeID}`);

        const [rows] = await pool.query('CALL GetAvailableTrucksByStore(?)', [storeID]);
        const trucks = { "Available": 0, "Busy": 0 };

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


export default router;