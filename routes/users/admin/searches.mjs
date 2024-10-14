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

export default router;