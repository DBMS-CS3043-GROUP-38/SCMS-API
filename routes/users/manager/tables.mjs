import express from "express";
import pool from "../../../utilities/database/db.mjs";

const router = express.Router();

router.get('/test', (req, res) => {
    res.send('Admin dashboard route working');
});

router.get('/trains-today', async (req, res) => {
    try {
        const StoreID = req.user.StoreID;  // Get StoreID from authenticated user

        // Call the stored procedure to fetch today's trains
        const query = 'CALL GetTrainsTodayByStore(?)';
        const [rows] = await pool.query(query, [StoreID]);

        // Check if any rows are returned
        if (rows[0].length === 0) {
            return res.status(404).json({ message: 'No trains scheduled for today' });
        }

        res.json(rows[0]);  // Return the first result set
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch trains today' });
    }
});

router.get('/active-trains', async (req, res) => {
    try {
        const StoreID = req.user.StoreID;  // Get StoreID from authenticated user

        // Call the stored procedure to fetch active trains
        const query = 'CALL GetActiveTrainsByStore(?)';
        const [rows] = await pool.query(query, [StoreID]);

        // Check if any rows are returned
        if (rows[0].length === 0) {
            return res.status(404).json({ message: 'No active trains found' });
        }

        res.json(rows[0]);  // Return the first result set
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch active trains' });
    }
});


router.get('/active-shipments', async (req, res) => {
    try {
        const StoreID = req.user.StoreID;  // Get StoreID from authenticated user

        // Call the stored procedure to fetch active shipments
        const query = 'CALL GetActiveShipmentsByStore(?)';
        const [rows] = await pool.query(query, [StoreID]);

        // Check if any rows are returned
        if (rows[0].length === 0) {
            return res.status(404).json({ message: 'No active shipments found' });
        }

        res.json(rows[0]);  // Return the first result set
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch active shipments' });
    }
});


router.get('/instore-orders-list', async (req, res) => {
    try {
        const StoreID = req.user.StoreID;  // Get StoreID from authenticated user

        // Call the stored procedure to fetch in-store orders
        const query = 'CALL GetInStoreOrdersByStore(?)';
        const [rows] = await pool.query(query, [StoreID]);

        // Check if any rows are returned
        if (rows[0].length === 0) {
            return res.status(404).json({ message: 'No in-store orders found' });
        }

        res.json(rows[0]);  // Return the first result set
    } catch (error) {
        console.error(error);
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

router.get('/orders-in-train', async (req, res) => {
    try {
        const StoreID = req.user.StoreID; // Get StoreID from authenticated user

        // Call the stored procedure to fetch orders in train
        const query = 'CALL GetOrdersInTrainByStore(?)';
        const [rows] = await pool.query(query, [StoreID]);

        console.log(`Fetched train assigned orders: ${rows[0].length} rows`);

        // Check if any rows are returned
        if (rows[0].length === 0) {
            return res.status(404).json({ message: 'No orders found in train' });
        }

        res.json(rows[0]); // Return the first result set
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch train assigned orders' });
    }
});


router.get('/orders-in-store', async (req, res) => {
    try {
        const StoreID = req.user.StoreID;
        const status = 'InStore'; // Set the status for the query
        const query = 'CALL GetOrdersByStatusAndStore(?, ?)';

        const [rows] = await pool.query(query, [StoreID, status]);
        console.log(`Fetched orders in store: ${rows[0].length} rows`);

        if (rows[0].length === 0) {
            return res.status(404).json({ message: 'No orders found in store' });
        }

        res.json(rows[0]); // Return the first result set
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to fetch orders in store' });
    }
});

router.get('/orders-in-shipment', async (req, res) => {
    try {
        const StoreID = req.user.StoreID;
        const status = 'InShipment'; // Set the status for the query
        const query = 'CALL GetOrdersByStatusAndStore(?, ?)';

        const [rows] = await pool.query(query, [StoreID, status]);
        console.log(`Fetched orders in shipment: ${rows[0].length} rows`);

        if (rows[0].length === 0) {
            return res.status(404).json({ message: 'No orders found in shipment' });
        }

        res.json(rows[0]); // Return the first result set
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to fetch orders in shipments' });
    }
});

router.get('/orders-in-truck', async (req, res) => {
    try {
        const StoreID = req.user.StoreID;
        const status = 'InTruck'; // Set the status for the query
        const query = 'CALL GetOrdersByStatusAndStore(?, ?)';

        const [rows] = await pool.query(query, [StoreID, status]);
        console.log(`Fetched orders in truck: ${rows[0].length} rows`);

        if (rows[0].length === 0) {
            return res.status(404).json({ message: 'No orders found in truck' });
        }

        res.json(rows[0]); // Return the first result set
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to fetch orders in truck' });
    }
});

router.get('/admin-data', async (req, res) => {
    try {
        const query = `
            select EmployeeID, Name, Contact, Address
            from employee
            where Type = 'Admin';
        `
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (e) {
        console.log(e);
        res.status(500).json({error: 'Failed to fetch manager data'});
    }
});

router.get('/drivers', async (req, res) => {
    try {
        const StoreID = req.user.StoreID;
        const query = 'CALL GetDriversByStore(?)'; // Use the stored procedure

        const [rows] = await pool.query(query, [StoreID]);

        if (rows[0].length === 0) {
            return res.status(404).json({ message: 'No drivers found' });
        }

        res.json(rows[0]); // Return the first result set
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: 'Failed to fetch drivers' });
    }
});


router.get('/assistants', async (req, res) => {
    try {
        const StoreID = req.user.StoreID;
        const query = 'CALL GetAssistantsByStore(?)'; // Use the stored procedure

        const [rows] = await pool.query(query, [StoreID]);

        if (rows[0].length === 0) {
            return res.status(404).json({ message: 'No assistants found' });
        }

        res.json(rows[0]); // Return the first result set
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: 'Failed to fetch assistants' });
    }
});


router.get('/trucks', async (req, res) => {
    try {
        const StoreID = req.user.StoreID;
        const query = 'CALL GetTrucksByStore(?)'; // Use the stored procedure

        const [rows] = await pool.query(query, [StoreID]);

        if (rows[0].length === 0) {
            return res.status(404).json({ message: 'No trucks found' });
        }

        res.json(rows[0]); // Return the first result set
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: 'Failed to fetch trucks' });
    }
});


router.get('/routes', async (req, res) => {
    try {
        const StoreID = req.user.StoreID;
        const query = 'CALL GetRoutesByStore(?)'; // Use the stored procedure

        const [rows] = await pool.query(query, [StoreID]);

        if (rows[0].length === 0) {
            return res.status(404).json({ message: 'No routes found' });
        }

        res.json(rows[0]); // Return the first result set
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: 'Failed to fetch routes' });
    }
});


router.get('/orders-by-shipment/:shipmentID', async (req, res) => {
    try {
        const shipmentID = req.params.shipmentID;
        const query = 'CALL GetOrdersByShipment(?)'; // Use the stored procedure

        const [rows] = await pool.query(query, [shipmentID]);

        if (rows[0].length === 0) {
            return res.status(404).json({ message: 'No orders found for this shipment' });
        }

        res.json(rows[0]); // Return the first result set
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: 'Failed to fetch orders by shipment' });
    }
});


router.get('/truck-schedule/:shipmentID', async (req, res) => {
    try {
        const shipmentID = req.params.shipmentID;
        const query = 'CALL GetTruckScheduleByShipment(?)'; // Use the stored procedure

        const [rows] = await pool.query(query, [shipmentID]);

        if (rows[0].length === 0) {
            return res.status(404).json({ message: 'No truck schedule found for this shipment' });
        }

        res.json(rows[0]); // Return the first result set
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: 'Failed to fetch truck schedule' });
    }
});


router.get('/truck-schedules', async (req, res) => {
    try {
        const storeID = req.user.StoreID;
        const query = 'CALL GetTruckSchedulesByStore(?)'; // Call the stored procedure

        const [rows] = await pool.query(query, [storeID]);

        res.json(rows[0]); // Return the first result set
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: 'Failed to fetch truck schedules' });
    }
});


export default router;