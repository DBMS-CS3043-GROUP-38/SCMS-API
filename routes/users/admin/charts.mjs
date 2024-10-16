import express from "express";
import pool from "../../../utilities/database/db.mjs";
import {formatRevenueData} from "../../../utilities/transformations.mjs";

const router = express.Router();

router.get('/test', (req, res) => {
    res.send('Admin dashboard route working');
});

router.get('/revenue-past-year', async (req, res) => {
    try {
        const query = `
            select YEAR(OrderDate) as Year, MONTH(OrderDate) as Month, SUM(Value) as TotalRevenue
            from order_details_with_latest_status
            where LatestStatus NOT LIKE 'Cancelled'
            group by YEAR(OrderDate), MONTH(OrderDate)
            order by Year desc, Month desc
            limit 12 offset 1;
        `;

        const [rows] = await pool.query(query);
        const revenueData = formatRevenueData(rows);
        console.log(`Fetched revenue data: ${revenueData.length} rows`);
        res.json(revenueData);
    } catch (e) {
        console.error(e);
        res.status(500).json({error: 'Failed to fetch revenue data'});
    }
});

router.get('/order-statuses', async (req, res) => {
    try {
        const query = `
            select count(*) as count, LatestStatus as status
            from order_details_with_latest_status
            group by LatestStatus;
        `;
        const [rows] = await pool.query(query);
        // const orderStatuses = rows.reduce((acc, row) => {
        //     acc[row.Status] = row.Count;
        //     return acc;
        // }, {});
        console.log(`Fetched order statuses: ${JSON.stringify(rows)}`);
        res.json(rows);
    } catch (e) {
        res.status(500).json({error: 'Failed to fetch order statuses'});
    }
});

router.get('/revenue-past-month', async (req, res) => {
    try {
        const query = `
            select DATE_FORMAT(OrderDate, '%d %M') as day, SUM(Value) as revenue
            from order_details_with_latest_status
            where LatestStatus NOT LIKE 'Cancelled'
            group by (OrderDate)
            order by OrderDate desc
            limit 30;
        `;
        const [rows] = await pool.query(query);
        console.log(`Fetched monthly revenue data: ${rows.length} rows`);
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({error: 'Failed to fetch monthly revenue data'});
    }
});

router.get('/revenue-per-store/:year/:quarter', async (req, res) => {
    const {year, quarter} = req.params;
    try {
        const query = `
            select StoreCity as store, TotalRevenue as revenue
            from quarterly_store_report
            where Year = ? and Quarter = ?
            order by revenue desc;
        `;
        const [rows] = await pool.query(query, [year, quarter]);
        console.log(`Fetched revenue per store data: ${rows.length} rows`);
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({error: 'Failed to fetch revenue per store data'});
    }
});

router.get('/customer-distribution', async (req, res) => {
    try {
        const customers = {"End": 0, "Retailer": 0}
        const query = `
            select Type, count(CustomerID) as count
            from customer
            group by Type;
        `

        const [rows] = await pool.query(query);
        rows.forEach(row => {
            customers[row.Type] = row.count;
        });
        console.log(`Fetched customer distribution: ${JSON.stringify(customers)}`);
        res.json(customers);
    } catch (e) {
        console.log(e);
        res.status(500).json({error: 'Failed to fetch customer distribution'});
    }
});

export default router;