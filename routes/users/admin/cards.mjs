import express from "express";
import pool from "../../../utilities/database/db.mjs";

const router = express.Router();

router.get('/test', (req, res) => {
    res.send('Admin dashboard route working');
});

router.get('/quarterly-sales', async (req, res) => {
    try {
        const query = `
            select YEAR(OrderDate) as Year, QUARTER(OrderDate) as Quarter, SUM(Value) as TotalRevenue
            from order_details_with_latest_status
            where LatestStatus != 'Cancelled'
               or LatestStatus != 'Attention'
            group by YEAR(OrderDate), QUARTER(OrderDate)
            order by Year desc, Quarter desc
            limit 2;
        `
        const [rows] = await pool.query(query);
        const data = {
            current: rows[0].TotalRevenue,
            previous: rows[1].TotalRevenue
        }

        res.json(data);
        console.log(`Quarterly sales data fetched: ${data} for the card`);
    } catch (error) {
        res.status(500).json({error: 'Failed to fetch quarterly sales'});
    }
});

router.get('/trains-completed', async (req, res) => {
    try {
        const query = `
            SELECT COUNT(CASE WHEN Status != 'Not Completed' THEN 1 END) AS completed,
                   COUNT(TrainID)                                        AS total
            FROM trainschedule
            WHERE DATE(ScheduleDateTime) = CURDATE();
        `;

        const [rows] = await pool.query(query);
        const completed = rows[0].completed || 0;
        const total = rows[0].total || 0;

        res.json({completed, total});
    } catch (e) {
        res.status(500).json({error: 'Failed to fetch trains completed'});
    }
})

router.get('/pending-orders', async (req, res) => {
    try {
        const query = `
            select count(OrderID) as pending
            from order_details_with_latest_status
            where LatestStatus = 'Pending'
        `;
        const [rows] = await pool.query(query);
        const pending = rows[0].pending || 0;

        res.json({pending});
    } catch (e) {
        res.send('Failed to fetch pending orders');
    }
})

router.get('/orders-attention', async (req, res) => {
    try {
        const query = `
            select count(OrderID) as attention
            from order_details_with_latest_status
            where LatestStatus = 'Attention'
        `;
        const [rows] = await pool.query(query);
        const attention = rows[0].attention || 0;

        res.json({attention});
    } catch (e) {
        res.send('Failed to fetch orders needing attention');
    }
})

router.get('/today-sales', async (req, res) => {
    try {
        const query = `
            select DATE(OrderDate) as Date, SUM(Value) as TotalRevenue
            from order_details_with_latest_status
            where LatestStatus NOT LIKE 'Cancelled'
            group by DATE(OrderDate)
            order by Date desc
            limit 2;
        `;

        const [rows] = await pool.query(query);
        const data = {
            current: rows[0].TotalRevenue,
            previous: rows[1].TotalRevenue
        }

        res.json(data);
    } catch (e) {
        res.status(500).json({error: 'Failed to fetch today sales'});
    }
});

router.get('/train-statuses', async (req, res) => {
    try {
        const query = `
            select Status, count(TrainID) as count
            from trainschedule
            group by Status;
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (e) {
        res.status(500).json({error: 'Failed to fetch train statuses'});
    }
});

router.get('/quarterly-orders', async (req, res) => {
    try {
        const query = `
            select YEAR(OrderDate) as Year, QUARTER(OrderDate) as Quarter, COUNT(OrderID) as TotalOrders
            from order_details_with_latest_status
            group by YEAR(OrderDate), QUARTER(OrderDate)
            order by Year desc, Quarter desc
            limit 2;
        `
        const [rows] = await pool.query(query);
        const data = {
            current: rows[0].TotalOrders,
            previous: rows[1].TotalOrders
        }

        res.json(data);
        console.log(`Quarterly orders data fetched: ${data} for the card`);
    } catch (error) {
        res.status(500).json({error: 'Failed to fetch quarterly orders'});
    }
})

router.get('/quarterly-store', async (req, res) => {
    try {
        const query = `
            select COUNT(OrderID) as TotalOrders, StoreID, StoreCity, SUM(Value) as TotalRevenue
            from order_details_with_latest_status
            where YEAR(CURDATE()) = YEAR(OrderDate)
              and QUARTER(CURDATE()) = QUARTER(OrderDate)
            group by StoreID
            order by TotalRevenue desc limit 1;
        `

        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({error: 'Failed to fetch quarterly store data'});
    }
})

router.get('/best-customer', async (req, res) => {
    try {
        const query = `
            select c.Name as Name, c.City as City, c.CustomerID as ID, SUM(o.Value) as TotalRevenue
            from (select *
                  from order_details_with_latest_status
                  where YEAR(OrderDate) = YEAR(CURDATE())
                    and QUARTER(OrderDate) = QUARTER(CURDATE())
                    and LatestStatus not in ('Cancelled', 'Attention')) o
                     join (customer c) on (o.CustomerID = c.CustomerID)
            group by o.CustomerID
            order by sum(o.Value) desc
            limit 1;
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({error: 'Failed to fetch best customer data'});
    }


})

export default router;