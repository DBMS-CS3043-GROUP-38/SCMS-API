import express from 'express';
import cards from './cards.mjs'
import charts from './charts.mjs'
import pool from "../../../utilities/database/db.mjs";
import {transformTopProducts, transformTopStores} from "../../../utilities/transformations.mjs";
import tables from './tables.mjs';

const router = express.Router();

router.use('/cards', cards);
router.use('/charts', charts);
router.use('/tables', tables);

//Routes
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
                  from quarterly_product_report s) as Ranked
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
            select YEAR(OrderDate)  as Year,
                   MONTH(OrderDate) as Month,
                   COUNT(OrderID)   as TotalOrders,
                   SUM(Value)       as TotalRevenue
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

router.get('/monthly-income', async (req, res) => {
    try {
        const query = `
            select SUM(Value) as TotalRevenue
            from order_details_with_latest_status
            where YEAR(OrderDate) = YEAR(CURDATE())
              and MONTH(OrderDate) = MONTH(CURDATE())
              and LatestStatus NOT LIKE 'Cancelled'
            group by MONTH(OrderDate);        `
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Failed to fetch monthly sales'});
    }
})



router.post('/schedule-trains', async (req, res) => {
    console.log('Scheduling trains');
    try {
        const query = `
        select AddFutureTrains() as result;
        `
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Failed to schedule trains'});
    }
})

router.get('/order-status', async (req, res) => {
    try {
        const query = `
        select LatestStatus as Status, count(OrderID) from order_details_with_latest_status group by LatestStatus;
        `
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: 'Failed to fetch order status'});
    }
})

router.get('/most-ordered-city', async (req, res) => {
    try {
        const query =   `
        select StoreCity, COUNT(OrderID) as Count from order_details_with_latest_status group by StoreCity order by Count desc ;
        `
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: 'Failed to get most ordered city'});
    }
})

router.get('/best-customers', async (req, res) => {
    try {
        const query = `
        select * from customer_report order by TotalRevenue desc limit 5;
        `
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (e) {
        console.log(e);
        res.status(500).json({error: 'Failed to fetch best customers'});
    }
})

router.get('/best-trucks', async (req, res) => {
    try {
        console.log('Called');
        const query = `
        select * from truck_report order by TotalDistance desc limit 5;
        `
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (e) {
        console.log(e);
        res.status(500).json({error: 'Failed to fetch best trucks'});
    }
})

router.get('/test', (req, res) => {
    res.send('Admin route working');
})

export default router;