import express from "express";
import pool from "../../../utilities/database/db.mjs";


const router = express.Router();

router.get('/test', (req, res) => {
    res.send('Admin dashboard route working');
});

router.get('/order/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            res.status(400).json({error: 'Order ID not provided'});
            return;
        }
        const query = `
            select OrderID                                        'Order ID',
                   DATE_FORMAT(OrderDate, '%Y-%m-%d')          as OrderDate,
                   CustomerID                                     'Customer ID',
                   CustomerName                                   'Customer Name',
                   CustomerType                                   'Customer Type',
                   StoreID                                        'Store ID',
                   StoreCity                                      'Store City',
                   RouteID                                        'Route ID',
                   trainschedule.TrainScheduleID                  'TrainScheduleID',
                   TrainID                                        'Train ID',
                   ShipmentID                                     'Shipment ID',
                   Value                                          'Value',
                   TotalVolume                                    'Total Volume',
                   LatestStatus                                   'Latest Status',
                   DATE_FORMAT(LatestTimeStamp, '%Y-%m-%d %T') as 'Last Updated',
                   ShipmentID                                     'Shipment ID',
                   DriverID                                       'Driver ID',
                   DriverName                                     'Driver Name',
                   AssistantID                                    'Assistant ID',
                   AssistantName                                  'Assistant Name',
                   TruckID                                        'Truck ID',
                   LicencePlate                                   'Truck Licence Plate'
            from order_details_with_latest_status
                     left outer join trainschedule
                          on order_details_with_latest_status.TrainScheduleID = trainschedule.TrainScheduleID
            where OrderID = ?;
        `;

        const [rows] = await pool.query(query, [id]);
        if (rows.length === 0) {
            res.status(404).json({error: 'Order not found'});
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Failed to fetch orders'});
    }
});

// Generic route handler function
const handleEntitySearch = (entityType) => async (req, res) => {
    const { by, term } = req.query;

    try {
        const [rows] = await pool.query('CALL search_entity(?, ?, ?)', [entityType, by || null, term || null]);
        // MySQL returns stored procedure results in an array where the first element contains our result set
        res.json(rows[0]);
    } catch (error) {
        console.error(`Database query failed for ${entityType}:`, error);
        res.status(500).json({ error: 'Database query failed' });
    }
};

// Simplified route definitions
router.get('/customer', handleEntitySearch('customer'));
router.get('/driver', handleEntitySearch('driver'));
router.get('/assistant', handleEntitySearch('assistant'));
router.get('/route', handleEntitySearch('route'));
router.get('/truck', handleEntitySearch('truck'));


router.get('/product/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const query = `CALL GetProductById(?)`;
        const [rows] = await pool.query(query, [id]);

        // Since stored procedures return results as an array of arrays, access the first array for results
        res.json(rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});


router.get('/product-sales/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const query = `CALL GetProductSales(?)`;
        const [rows] = await pool.query(query, [id]);
        res.json(rows[0]); // Accessing the first element since CALL returns results in an array
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch product sales' });
    }
});



export default router;