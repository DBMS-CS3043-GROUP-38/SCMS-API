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

router.get('/customer', async (req, res) => {
    const {by, term} = req.query;
    let query = '';
    let queryParams = [];

    if (!by || !term) {
        query = `
            SELECT CustomerID   AS 'Customer ID',
                   Name         AS 'Customer Name',
                   City         AS 'City',
                   Contact      AS 'Phone',
                   Address      AS 'Address',
                   TotalRevenue AS 'Total Revenue',
                   TotalOrders  AS 'Total Orders'
            FROM customer_report;
        `;
    } else {
        switch (by) {
            case 'name':
                query = `
                    SELECT CustomerID   AS 'Customer ID',
                           Name         AS 'Customer Name',
                           City         AS 'City',
                           Contact      AS 'Phone',
                           Address      AS 'Address',
                           TotalRevenue AS 'Total Revenue',
                           TotalOrders  AS 'Total Orders'
                    FROM customer_report
                    WHERE Name LIKE ?;
                `;
                queryParams = [`%${term}%`];
                break;
            case 'id':
                query = `
                    SELECT CustomerID   AS 'Customer ID',
                           Name         AS 'Customer Name',
                           City         AS 'City',
                           Contact      AS 'Phone',
                           Address      AS 'Address',
                           TotalRevenue AS 'Total Revenue',
                           TotalOrders  AS 'Total Orders'
                    FROM customer_report
                    WHERE CustomerID = ?;
                `;
                queryParams = [term];
                break;
            default:
                res.status(400).json({error: 'Invalid search parameter'});
                return;
        }
    }

    try {
        const [rows] = await pool.query(query, queryParams);
        res.json(rows);
    } catch (error) {
        console.error('Database query failed:', error);
        res.status(500).json({error: 'Database query failed'});
    }
});

router.get('/driver', async (req, res) => {
    const {by, term} = req.query;
    let query = '';
    let queryParams = [];

    if (!by || !term) {
        query = `
            select DriverID       AS 'Driver ID',
                   Name           AS 'Driver Name',
                   StoreID        AS 'Store ID',
                   Contact        AS 'Phone',
                   Status         AS 'Availability',
                   CompletedHours AS 'CompletedHours',
                   WorkingHours   AS 'WorkHours'
            from driver_details_with_employee;
        `;
    } else {
        switch (by) {
            case 'name':
                query = `
                    select DriverID       AS 'Driver ID',
                           Name           AS 'Driver Name',
                           StoreID        AS 'Store ID',
                           Contact        AS 'Phone',
                           Status         AS 'Availability',
                           CompletedHours AS 'CompletedHours',
                           WorkingHours   AS 'WorkHours'
                    from driver_details_with_employee
                    where Name LIKE ?;
                `;
                queryParams = [`%${term}%`];
                break;
            case 'id':
                query = `
                    select DriverID       AS 'Driver ID',
                           Name           AS 'Driver Name',
                           StoreID        AS 'Store ID',
                           Contact        AS 'Phone',
                           Status         AS 'Availability',
                           CompletedHours AS 'CompletedHours',
                           WorkingHours   AS 'WorkHours'
                    from driver_details_with_employee
                    where DriverID = ?;
                `;
                queryParams = [term];
                break;
            default:
                res.status(400).json({error: 'Invalid search parameter'});
                return;
        }
    }
    try {
        const [rows] = await pool.query(query, queryParams);
        res.json(rows);
    } catch (error) {
        console.error('Database query failed:', error);
        res.status(500).json({error: 'Database query failed'});
    }
});

router.get('/assistant', async (req, res) => {
    const {by, term} = req.query;
    let query = '';
    let queryParams = [];

    if (!by || !term) {
        query = `
            select AssistantID    AS 'Assistant ID',
                   Name           AS 'Assistant Name',
                   StoreID        AS 'Store ID',
                   Contact        AS 'Phone',
                   Status         AS 'Availability',
                   CompletedHours AS 'CompletedHours',
                   WorkingHours   AS 'WorkHours'
            from assistant_details_with_employee;
        `;
    } else {
        switch (by) {
            case 'name':
                query = `
                    select AssistantID    AS 'Assistant ID',
                           Name           AS 'Assistant Name',
                           StoreID        AS 'Store ID',
                           Contact        AS 'Phone',
                           Status         AS 'Availability',
                           CompletedHours AS 'CompletedHours',
                           WorkingHours   AS 'WorkHours'
                    from assistant_details_with_employee
                    where Name LIKE ?;
                `;
                queryParams = [`%${term}%`];
                break;
            case 'id':
                query = `
                    select AssistantID    AS 'Assistant ID',
                           Name           AS 'Assistant Name',
                           StoreID        AS 'Store ID',
                           Contact        AS 'Phone',
                           Status         AS 'Availability',
                           CompletedHours AS 'CompletedHours',
                           WorkingHours   AS 'WorkHours'
                    from assistant_details_with_employee
                    where AssistantID = ?;
                `;
                queryParams = [term];
                break;
            default:
                res.status(400).json({error: 'Invalid search parameter'});
                return;
        }
    }
    try {
        const [rows] = await pool.query(query, queryParams);
        res.json(rows);
    } catch (error) {
        console.error('Database query failed:', error);
        res.status(500).json({error: 'Database query failed'});
    }
});

router.get('/route', async (req, res) => {
    const {by, term} = req.query;
    let query = '';
    let queryParams = [];

    if (!by || !term) {
        query = `
            select RouteID       AS 'Route ID',
                   StoreID       AS 'Store ID',
                   Distance      AS 'Distance(KM)',
                   Time_duration AS 'Time Duration',
                   Description   AS 'Description'
            from route;
        `;
    } else {
        switch (by) {
            case 'id':
                query = `
                    select RouteID       AS 'Route ID',
                           StoreID       AS 'Store ID',
                           Distance      AS 'Distance(KM)',
                           Time_duration AS 'Time Duration',
                           Description   AS 'Description'
                    from route
                    where RouteID = ?;
                `;
                queryParams = [term];
                break;
            default:
                res.status(400).json({error: 'Invalid search parameter'});
                return;
        }
    }
    try {
        const [rows] = await pool.query(query, queryParams);
        res.json(rows);
    } catch (error) {
        console.error('Database query failed:', error);
        res.status(500).json({error: 'Database query failed'});
    }
})

router.get('/truck', async (req, res) => {
    const {by, term} = req.query;
    let query = '';
    let queryParams = [];


    if (!by || !term) {
        query = `
            select td.TruckID    AS 'Truck ID',
                   LicencePlate  AS 'Licence Plate',
                   StoreID       AS 'Store ID',
                   TotalDistance AS 'Total Distance(KM)',
                   Status        as 'Availability'
            from truck
                     join truck_distances td on truck.TruckID = td.TruckID order by td.TruckID;
        `;
    } else {
        switch (by) {
            case 'id':
                query = `
                    select td.TruckID    AS 'Truck ID',
                            LicencePlate  AS 'Licence Plate',
                            StoreID       AS 'Store ID',
                            TotalDistance AS 'Total Distance(KM)',
                            Status        as 'Availability'
                    from truck
                                join truck_distances td on truck.TruckID = td.TruckID
                    where td.TruckID = ? order by td.TruckID;
                `;
                queryParams = [term];
                break;
            case 'name':
                query = `
                    select td.TruckID    AS 'Truck ID',
                            LicencePlate  AS 'Licence Plate',
                            StoreID       AS 'Store ID',
                            TotalDistance AS 'Total Distance(KM)',
                            Status        as 'Availability'
                    from truck
                                join truck_distances td on truck.TruckID = td.TruckID
                    where LicencePlate LIKE ? order by td.TruckID;
                `;
                queryParams = [`%${term}%`];
                break;
            default:
                res.status(400).json({error: 'Invalid search parameter'});
                return;
        }
    }
    try {
        const [rows] = await pool.query(query, queryParams);
        res.json(rows);
    } catch (error) {
        console.error('Database query failed:', error);
        res.status(500).json({error: 'Database query failed'});
    }
})

router.get('/product/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const query = `
            select ProductID as id, Name as name, Type as category, Price as price
            from product
            where ProductID = ${id};
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Failed to fetch products'});
    }
})

router.get('/product-sales/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const query = `
            SELECT CONCAT(Year, ' - ', Quarter) AS Quarter, TotalRevenue
            FROM quarterly_product_report
            WHERE ProductID = ${id}
            ORDER BY Year, Quarter;
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (e) {
        console.log(e);
        res.status(500).json({error: 'Failed to fetch product sales'});
    }
})


export default router;