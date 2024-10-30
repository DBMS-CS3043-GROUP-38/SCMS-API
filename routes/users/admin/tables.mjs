import express from "express";
import pool from "../../../utilities/database/db.mjs";

const router = express.Router();

router.get('/test', (req, res) => {
    res.send('Admin dashboard route working');
});

router.get('/trains-today', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetTrainsToday()');
        res.json(rows[0]); // Access the first element since CALL returns an array of arrays
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to fetch trains today' });
    }
});


router.get('/best-products-quarter', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetBestProductsQuarter()');
        res.json(rows[0]); // Access the first element since CALL returns an array of arrays
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to fetch best products of the quarter' });
    }
});


router.get('/products/:type', async (req, res) => {
    try {
        const type = req.params.type;
        const [rows] = await pool.query('CALL GetProductsByType(?)', [type]);
        res.json(rows[0]); // Access the first element since CALL returns an array of arrays
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});


router.get('/weekly-trains', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetWeeklyTrains()');
        res.json(rows[0]); // Access the first element since CALL returns an array of arrays
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to fetch weekly trains' });
    }
});


router.get('/scheduled-trains', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetScheduledTrains()');
        res.json(rows[0]); // Access the first element since CALL returns an array of arrays
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to fetch scheduled trains' });
    }
});


router.get('/active-trains', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetActiveTrains()');
        res.json(rows[0]); // Access the first element since CALL returns an array of arrays
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to fetch active trains' });
    }
});


router.get('/pending-orders-list', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetPendingOrders()');
        res.json(rows[0]); // Access the first element since CALL returns an array of arrays
    } catch (e) {
        console.error(e); // Log the error for better debugging
        res.status(500).send('Failed to fetch pending orders');
    }
});


router.get('/orders-by-train/:trainSchID', async (req, res) => {
    try {
        const trainID = req.params.trainSchID;
        const [rows] = await pool.query('CALL GetOrdersByTrain(?)', [trainID]);
        res.json(rows[0]); // Access the first element since CALL returns an array of arrays
    } catch (e) {
        console.error(e); // Log the error for better debugging
        res.status(500).json({error: 'Failed to fetch orders by train'});
    }
});

router.get('/top-products-quarter/:year/:quarter', async (req, res) => {
    try {
        const { year, quarter } = req.params;
        const [rows] = await pool.query('CALL GetTopProductsQuarter(?, ?)', [year, quarter]);
        res.json(rows[0]); // Access the first element since CALL returns an array of arrays
    } catch (e) {
        console.error(e); // Log the error for better debugging
        res.status(500).json({ error: 'Failed to fetch top products per quarter' });
    }
});


router.get('/top-customers-quarter/:year/:quarter', async (req, res) => {
    try {
        const { year, quarter } = req.params;
        const [rows] = await pool.query('CALL GetTopCustomersQuarter(?, ?)', [year, quarter]);
        console.log(`Fetched top customers for ${year} Q${quarter}: ${rows[0].length} rows`);
        res.json(rows[0]); // Access the first element since CALL returns an array of arrays
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch top customers per quarter' });
    }
});


router.get('/order-products/:orderID', async (req, res) => {
    try {
        const orderID = req.params.orderID;
        const [rows] = await pool.query('CALL GetOrderProducts(?)', [orderID]);
        res.json(rows[0]); // Access the first element since CALL returns an array of arrays
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch order products' });
    }
});


router.get('/tracking-details/:orderID', async (req, res) => {
    try {
        const orderID = req.params.orderID;
        const [rows] = await pool.query('CALL GetTrackingDetails(?)', [orderID]);
        res.json(rows[0]); // Access the first element, as CALL returns an array of arrays
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch tracking details' });
    }
});


router.get('/train-assigned-orders', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetTrainAssignedOrders()');
        console.log(`Fetched train assigned orders: ${rows[0].length} rows`);
        res.json(rows[0]); // Use rows[0] since CALL returns an array of arrays
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch train assigned orders' });
    }
});


router.get('/orders-in-train', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetOrdersInTrain()');
        console.log(`Fetched orders in train: ${rows[0].length} rows`);
        res.json(rows[0]); // Access rows[0] since CALL returns an array of arrays
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch orders in train' });
    }
});



// Orders in Store
router.get('/orders-in-store', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetOrdersByStatus(?)', ['InStore']);
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch orders in store' });
    }
});

// Orders in Shipment
router.get('/orders-in-shipment', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetOrdersByStatus(?)', ['InShipment']);
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch orders in shipment' });
    }
});

// Orders in Truck
router.get('/orders-in-truck', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetOrdersByStatus(?)', ['InTruck']);
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch orders in truck' });
    }
});



router.get('/attention-orders', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetAttentionOrders()');
        console.log(`Fetched attention orders: ${rows[0].length} rows`);
        res.json(rows[0]); // Access rows[0] to get the results from the stored procedure
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch attention orders' });
    }
});



router.get('/store-data', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetStoreData()');
        res.json(rows[0]); // Access rows[0] to get the results from the stored procedure
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch store data' });
    }
});


router.get('/manager-data', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetManagerData()');
        res.json(rows[0]); // Access rows[0] to get the results from the stored procedure
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch manager data' });
    }
});


router.get('/top-customers', async (req, res) => {
    try {
        const [rows] = await pool.query('CALL GetTopCustomers()');
        res.json(rows[0]); // Access rows[0] to get the results from the stored procedure
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch top customers' });
    }
});


export default router;