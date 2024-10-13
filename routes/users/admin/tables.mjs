import express from "express";
import pool from "../../../utilities/database/db.mjs";

const router = express.Router();

router.get('/test', (req, res) => {
    res.send('Admin dashboard route working');
});

router.get('/trains-today', async (req, res) => {
    try {
        const query = `
            select TrainID as id, StoreCity as destination, FilledPercentage as capacityFilled,FullCapacity as fullCapacity,ScheduleDateTime as time
            from train_schedule_with_destinations
            where DATE(ScheduleDateTime) = CURDATE() order by ScheduleDateTime;
        `
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Failed to fetch trains today'});
    }
})

router.get('/best-products-quarter' , async (req, res) => {
    try {
        const query = `
            select 
                ProductID as id,
                ProductName as name,
                ProductType as category,
                TotalRevenue as revenue
            from quarterly_product_report
            where Year = YEAR(CURDATE()) and Quarter = QUARTER(CURDATE()) order by revenue desc;
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Failed to fetch best product of the quarter'});
    }
});

export default router;