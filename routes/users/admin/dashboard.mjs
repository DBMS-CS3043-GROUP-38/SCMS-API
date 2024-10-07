import express from "express";
import pool from '../../../utilities/database/db.mjs'
import {transformTopProducts, transformTopStores} from "../../../utilities/transformations.mjs";

const router = express.Router();

router.get('/test', (req, res) => {
    res.send('Admin dashboard route working');
});

router.get('/top-products', async (req, res) => {
    try {
        const query = `
            select *
            from (select s.Year,
                         s.Quarter,
                         s.ProductID,
                         s.ProductName,
                         s.TotalQuantity,
                         s.TotalRevenue,
                         ROW_NUMBER() over (partition by s.Year, s.Quarter order by s.TotalRevenue desc) as rn
                  from quarterly_order_report s) as Ranked
            where rn <= 5
            order by Year, Quarter, TotalRevenue desc;
        `
        const [rows] = await pool.query(query);
        const transformedData = transformTopProducts(rows);
        res.json(transformedData);
    } catch (error) {
        res.status(500).json({error: 'Failed to fetch top products'});
    }
});

router.get('/top-stores', async (req, res) => {
    try {
        const query = `select *
                       from quarterly_store_report
                       order by Year, Quarter, TotalRevenue desc;`
        const [rows] = await pool.query(query);
        const transformedData = transformTopStores(rows);
        res.json(transformedData);
    } catch (error) {
        res.status(500).json({error: 'Failed to fetch top stores'});
    }
})

router.get('/monthly-sales', async (req, res) => {
    try {
        const query = `
            select YEAR(OrderDate)              as Year,
                   MONTH(OrderDate)             as Month,
                   COUNT(OrderID)               as TotalOrders,
                   SUM(Value)                   as TotalRevenue
            from order_details_with_latest_status
            where OrderDate >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
              AND LatestStatus NOT LIKE 'Cancelled'
            GROUP BY YEAR(OrderDate), MONTH(OrderDate)
            ORDER BY Year, Month;
        `
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Failed to fetch annual sales'});
    }
});

router.get('/daily-sales', async (req, res) => {
    try {
        const query = `
            select DATE_FORMAT(OrderDate, '%b-%d') as OrderDay, SUM(Value) as TotalRevenue
            from order_details_with_latest_status
            where OrderDate >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
              AND LatestStatus NOT LIKE 'Cancelled'
            GROUP BY OrderDate
            ORDER BY OrderDate;
        `
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Failed to fetch daily sales'});
    }
});

export default router;