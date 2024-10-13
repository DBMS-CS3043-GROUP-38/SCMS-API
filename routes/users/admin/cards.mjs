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
            where LatestStatus NOT LIKE 'Cancelled'
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
            SELECT COUNT(CASE WHEN Status = 'Completed' THEN 1 END) AS completed,
                   COUNT(TrainID)                                   AS total
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
            where LatestStatus = 'PendingTrain'
        `;
        const [rows] = await pool.query(query);
        const pending = rows[0].pending || 0;

        res.json({pending});
    } catch (e) {
        res.send('Failed to fetch pending trains');
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

export default router;