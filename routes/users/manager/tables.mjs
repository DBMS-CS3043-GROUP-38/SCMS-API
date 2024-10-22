import express from "express";
import pool from "../../../utilities/database/db.mjs";

const router = express.Router();

router.get('/test', (req, res) => {
    res.send('Admin dashboard route working');
});

router.get('/trains-today', async (req, res) => {
    try {
        const StoreID = req.user.StoreID
        const query = `
            select TrainScheduleID  as id,
                   StoreCity        as destination,
                   FilledPercentage as capacityFilled,
                   FullCapacity     as fullCapacity,
                   ScheduleDateTime as time
            from train_schedule_with_destinations
            where DATE(ScheduleDateTime) = CURDATE() and StoreID = ${StoreID}
            order by ScheduleDateTime;
        `
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Failed to fetch trains today'});
    }
})

router.get('/best-products-quarter', async (req, res) => {
    try {
        const query = `
            select ProductID    as id,
                   ProductName  as name,
                   ProductType  as category,
                   TotalRevenue as revenue
            from quarterly_product_report
            where Year = YEAR(CURDATE())
              and Quarter = QUARTER(CURDATE())
            order by revenue desc;
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Failed to fetch best product of the quarter'});
    }
});

router.get('/weekly-trains', async (req, res) => {
    try {
        const query = `
            select TrainID      as id,
                   Day          as dayOfWeek,
                   Time         as time,
                   FullCapacity as maxCapacity,
                   s.City       as destinationCity
            from train
                     join store s on s.StoreID = train.StoreID
            order by dayOfWeek, time
            ;
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Failed to fetch weekly trains'});
    }
});

router.get('/scheduled-trains', async (req, res) => {
    try {
        const query = `
            select TrainID          as id,
                   TrainScheduleID  as scheduleID,
                   StoreCity        as destination,
                   FilledPercentage as capacityFilled,
                   FullCapacity     as fullCapacity,
                   ScheduleDateTime as time,
                   TotalOrders      as orders
            from train_schedule_with_destinations
            where Status = 'Not Completed'
            order by ScheduleDateTime
            ;
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Failed to fetch scheduled trains'});
    }
});

router.get('/active-trains', async (req, res) => {
    try {
        const query = `
            select TrainID          as id,
                   TrainScheduleID  as scheduleID,
                   StoreCity        as destination,
                   FilledPercentage as capacityFilled,
                   FullCapacity     as fullCapacity,
                   ScheduleDateTime as time,
                   Status           as status
            from train_schedule_with_destinations
            where Status != 'Completed'
            order by ScheduleDateTime;
        `
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (e) {
        console.log(e);
        res.status(500).json({error: 'Failed to fetch active trains'});
    }
})

router.get('/instore-orders-list', async (req, res) => {
    try {
        const StoreID = req.user.StoreID;
        const query = `
            select OrderID                            as OrderID,
                   DATE_FORMAT(OrderDate, '%Y-%m-%d') as OrderDate,
                   Value                              as Value,
                   TotalVolume                        as TotalVolume,
                   StoreCity                          as StoreCity,
                   RouteID                            as RouteID
            from order_details_with_latest_status
            where LatestStatus = 'InStore' and StoreID = ${StoreID};
        `;
        const [rows] = await pool.query(query);

        res.json(rows);
    } catch (e) {
        res.send('Failed to fetch pending orders');
    }
});

router.get('/orders-by-train/:trainSchID', async (req, res) => {
    try {
        const trainID = req.params.trainSchID;
        const query = `
            select o.OrderID as orderID, o.CustomerID as customerID, o.TotalVolume as Capacity, o.Value as Price
            from (select OrderID from train_contains where TrainScheduleID = ${trainID}) t
                     join \`order\` o on o.OrderID = t.OrderID;
        `

        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (e) {
        console.log(e);
        res.status(500).json({error: 'Failed to fetch orders by train'});
    }

});

router.get('/top-products-quarter/:year/:quarter', async (req, res) => {
    try {
        const StoreID = req.user.StoreID;
        const {year, quarter} = req.params;
        const query = `
            select ProductID    as ProductID,
                   ProductName  as Name,
                   ProductType  as Category,
                   TotalRevenue as Revenue
            from quarterly_product_report
            where Year = ${year}
              and Quarter = ${quarter}
            order by revenue desc
            limit 100;
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({error: 'Failed to fetch top products per quarter'});
    }
})

router.get('/top-customers-quarter/:year/:quarter', async (req, res) => {
    try {
        const storeID = req.user.StoreID;
        const {year, quarter} = req.params;
        const query = `
            select c.CustomerID as CustomerID,
                   c.Name       as Name,
                   c.City       as City,
                   SUM(o.Value) as Revenue
            from (select *
                  from order_details_with_latest_status
                  where StoreID = ${storeID}
                  and YEAR(OrderDate) = ${year}
                    and QUARTER(OrderDate) = ${quarter}
                    and LatestStatus not in ('Cancelled', 'Attention')) o
                     join customer c on o.CustomerID = c.CustomerID
            group by o.CustomerID
            order by Revenue desc
            limit 100;
        `;
        const [rows] = await pool.query(query);
        console.log(`Fetched top customers for ${year} Q${quarter}: ${rows.length} rows`);
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({error: 'Failed to fetch top customers per quarter'});
    }
});

router.get('/order-products/:orderID', async (req, res) => {
    try {
        const orderID = req.params.orderID;
        const query = `
            select product.ProductID                             as ProductID,
                   product.Name                                  as ProductName,
                   CONCAT(product.Price, ' x ', contains.Amount) as 'Price x Quantity',
                   contains.Amount * product.Price               as TotalPrice
            from contains
                     join product on contains.ProductID = product.ProductID
            where OrderID = ${orderID}
            order by ProductID;
        `

        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Failed to fetch order products'});
    }
});

router.get('/tracking-details/:orderID', async (req, res) => {
    try {
        const orderID = req.params.orderID;
        const query = `
            select DATE_FORMAT(TimeStamp, '%e-%b-%y %T') as 'Time Stamp', Status
            from order_tracking
            where OrderID = ${orderID}
            order by TimeStamp;
        `

        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Failed to fetch tracking details'});
    }
});

router.get('/train-assigned-orders', async (req, res) => {
    try {
        const query = `select tc.OrderID                                      as OrderID,
                              ts.TrainScheduleID                              as TrainScheduleID,
                              ts.StoreCity                                    as Destination,
                              DATE_FORMAT(ts.ScheduleDateTime, '%e-%b-%y %T') as TrainTime
                       from (select *
                             from order_details_with_latest_status
                             where LatestStatus = 'PendingDispatch') as trainAssigned
                                join train_contains tc on trainAssigned.OrderID = tc.OrderID
                                join train_schedule_with_destinations ts on tc.TrainScheduleID = ts.TrainScheduleID;
        `;

        const [rows] = await pool.query(query);
        console.log(`Fetched train assigned orders: ${rows.length} rows`);
        res.json(rows);
    } catch (e) {
        console.log(e);
        res.status(500).json({error: 'Failed to fetch train assigned orders'});
    }
});

router.get('/orders-in-train', async (req, res) => {
    try {
        const StoreID = req.user.StoreID;
        const query = `select tc.OrderID                                      as OrderID,
                              ts.TrainScheduleID                              as TrainScheduleID,
                              ts.StoreCity                                    as Destination,
                              DATE_FORMAT(ts.ScheduleDateTime, '%e-%b-%y %T') as TrainTime
                       from (select *
                             from order_details_with_latest_status
                             where LatestStatus = 'InTrain' and StoreID = ${StoreID}) as trainAssigned
                                join train_contains tc on trainAssigned.OrderID = tc.OrderID
                                join train_schedule_with_destinations ts on tc.TrainScheduleID = ts.TrainScheduleID;
        `;

        const [rows] = await pool.query(query);
        console.log(`Fetched train assigned orders: ${rows.length} rows`);
        res.json(rows);
    } catch (e) {
        console.log(e);
        res.status(500).json({error: 'Failed to fetch train assigned orders'});
    }
});

router.get('/orders-in-store', async (req, res) => {
    try {
        const StoreID = req.user.StoreID;
        const query = `
            select OrderID, StoreID, StoreCity, RouteID
            from order_details_with_latest_status
            where StoreID = ${StoreID}
                and LatestStatus = 'InStore';
        `

        const [rows] = await pool.query(query);
        console.log(`Fetched orders in store: ${rows.length} rows`);
        res.json(rows);
    } catch (e) {
        console.log(e);
        res.status(500).json({error: 'Failed to fetch orders in store'});
    }
});

router.get('/orders-in-shipment', async (req, res) => {
    try {
        const StoreID = req.user.StoreID;
        const query = `
            select OrderID, StoreID, ShipmentID, ShipmentStatus
            from order_details_with_latest_status
            where StoreID = ${StoreID}
               and LatestStatus = 'InShipment';
        `


        const [rows] = await pool.query(query);
        console.log(`Fetched orders in shipment: ${rows.length} rows`);
        res.json(rows);
    } catch (e) {
        console.log(e);
        res.status(500).json({error: 'Failed to fetch orders in store'});
    }
});

router.get('/orders-in-truck', async (req, res) => {
    try {
        const StoreID = req.user.StoreID;
        const query = `
            select OrderID, StoreID, TruckID, AssistantID, DriverID
            from order_details_with_latest_status
            where StoreID = ${StoreID}
              and LatestStatus = 'InTruck';
        `


        const [rows] = await pool.query(query);
        console.log(`Fetched orders in truck: ${rows.length} rows`);
        res.json(rows);
    } catch (e) {
        console.log(e);
        res.status(500).json({error: 'Failed to fetch orders in truck'});
    }
});

router.get('/attention-orders', async (req, res) => {
    try {
        const query = `
            select OrderID,
                   StoreCity,
                   o.CustomerID,
                   o.CustomerName,
                   c.Contact       as CustomerContact,
                   LatestTimeStamp as TimeStamp
            from order_details_with_latest_status o
                     join customer c on o.CustomerID = c.CustomerID
            where LatestStatus = 'Attention';
        `

        const [rows] = await pool.query(query);
        console.log(`Fetched attention orders: ${rows.length} rows`);
        res.json(rows);
    } catch (e) {
        console.log(e);
        res.status(500).json({error: 'Failed to fetch attention orders'});
    }
});


router.get('/store-data', async (req, res) => {
    const query = `
        select s.StoreID,
               s.City,
               COUNT(DISTINCT r.RouteID)     AS Routes,
               COUNT(DISTINCT a.AssistantID) AS Assistants,
               COUNT(DISTINCT d.DriverID)    AS Drivers,
               COUNT(DISTINCT t.TruckID)     AS Trucks

        from store s
                 join route r on s.StoreID = r.StoreID
                 join truck t on t.StoreID = s.StoreID
                 join driver_details_with_employee d on d.StoreID = s.StoreID
                 join assistant_details_with_employee a on a.StoreID = s.StoreID
        group by s.StoreID;
    `
    try {
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (e) {
        console.log(e);
        res.status(500).json({error: 'Failed to fetch store data'});
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

router.get('/top-customers', async (req, res) => {
    try {
        const query = `
            select CustomerID, Name, TotalOrders, TotalRevenue
            from customer_report
            order by TotalRevenue desc
            limit 100;
        `

        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (e) {
        console.log(e);
        res.status(500).json({error: 'Failed to fetch top customers'});
    }
});

router.get('/drivers', async (req , res) => {
    try {
        const StoreID = req.user.StoreID;
        const query = `
            select DriverID       AS 'Driver ID',
                   Name           AS 'Driver Name',
                   Contact        AS 'Phone',
                   Status         AS 'Availability',
                   CompletedHours AS 'CompletedHours',
                   WorkingHours   AS 'WorkHours'
            from driver_details_with_employee where StoreID = ${StoreID};
        `;

        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (e) {
        console.log(e);
        res.status(500).json({error: 'Failed to fetch drivers'});
    }
});

export default router;