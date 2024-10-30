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
        const query = `
            select AssistantID    AS 'Assistant ID',
                   Name           AS 'Assistant Name',
                   StoreID        AS 'Store ID',
                   Contact        AS 'Phone',
                   Status         AS 'Availability',
                   CompletedHours AS 'CompletedHours',
                   WorkingHours   AS 'WorkHours'
            from assistant_details_with_employee
            where StoreID = ${StoreID};
        `;

        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (e) {
        console.log(e);
        res.status(500).json({error: 'Failed to fetch assistant'});
    }
});

router.get('/trucks', async (req, res) => {
    try {
        const StoreID = req.user.StoreID;
        const query = `
            select td.TruckID    AS 'Truck ID',
                   LicencePlate  AS 'Licence Plate',
                   TotalDistance AS 'Total Distance(KM)',
                   Status        as 'Availability'
            from truck
                     join truck_distances td on truck.TruckID = td.TruckID
            where StoreID = ${StoreID}
            order by td.TruckID;
        `;

        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (e) {
        console.log(e);
        res.status(500).json({error: 'Failed to fetch trucks'});
    }
});

router.get('/routes', async (req, res) => {
    try {
        const StoreID = req.user.StoreID;
        const query = `
            select RouteID       AS 'Route ID',
                   StoreID       AS 'Store ID',
                   Distance      AS 'Distance(KM)',
                   Time_duration AS 'Time Duration',
                   Description   AS 'Description'
            from route
            where StoreID = ${StoreID};
        `;

        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (e) {
        console.log(e);
        res.status(500).json({error: 'Failed to fetch routes'});
    }
});

router.get('/orders-by-shipment/:shipmentID', async (req, res) => {
    try {
        const shipmentID = req.params.shipmentID;
        const query = `
            select OrderID                                     as orderID,
                   order_details_with_latest_status.CustomerID as customerID,
                   CustomerName                                as customerName,
                   RouteID                                     as routeID,
                   Address                                     as address,
                   Contact                                     as contact,
                   TotalVolume                                 as volume,
                   OrderDate                                   as orderDate
            from order_details_with_latest_status
                     join customer on customer.CustomerID = order_details_with_latest_status.CustomerID
            where ShipmentID = ${shipmentID};
        `
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (e) {
        console.log(e);
        res.status(500).json({error: 'Failed to fetch orders by shipment'});
    }
});

router.get('/truck-schedule/:shipmentID', async (req, res) => {
    try {
        const shipmentID = req.params.shipmentID;
        const query = `
            select *
            from truck_schedule_with_details
            where ShipmentID = ${shipmentID};
        `
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (e) {
        console.log(e);
        res.status(500).json({error: 'Failed to fetch truck schedule'});
    }
});

router.get('/truck-schedules', async (req, res) => {
    try {
        const storeID = req.user.StoreID;
        const query = `
            select 
                TruckScheduleID as 'Schedule ID',
                ShipmentID as 'Shipment ID',
                TruckID as 'Truck ID',
                ShipmentID as 'Shipment ID',
                DriverID as 'Driver ID',
                DriverName as 'Driver Name',
                AssistantID as 'Assistant ID',
                AssistantName as 'Assistant Name',
                Delivered as 'Delivered',
                TotalOrders as 'Total Orders',
                ScheduleDateTime as 'Schedule Time',
            Status as 'Status'
            from truck_schedule_with_details where  StoreID = ${storeID};
        `
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (e) {
        console.log(e);
        res.status(500).json({error: 'Failed to fetch truck schedules'});
    }
})

export default router;