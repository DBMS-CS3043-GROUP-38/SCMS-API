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

router.get('/weekly-trains', async (req, res) => {
    try {
        const query = `
            select 
                TrainID as id,
                Day as dayOfWeek,
                Time as time,
                FullCapacity as maxCapacity,
                s.City as destinationCity
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
} );

router.get('/scheduled-trains', async (req, res) => {
    try {
        const query = `
            select 
                TrainID as id,
                StoreCity as destination,
                FilledPercentage as capacityFilled,
                FullCapacity as fullCapacity,
                ScheduleDateTime as time,
                TotalOrders as orders
            from train_schedule_with_destinations where Status = 'Not Completed' order by ScheduleDateTime
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
            select TrainID as id, StoreCity as destination, FilledPercentage as capacityFilled,FullCapacity as fullCapacity,ScheduleDateTime as time, Status as status 
            from train_schedule_with_destinations
            where Status != 'Completed' order by ScheduleDateTime;
        `
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (e) {
        console.log(e);
        res.status(500).json({error: 'Failed to fetch active trains'});
    }
})

router.get('/pending-orders-list', async (req, res) => {
    try {
        const query = `
            select 
                OrderID as OrderID,
                OrderDate as OrderDate,
                Value as Value,
                TotalVolume as TotalVolume,
                StoreCity as StoreCity,
                RouteID as RouteID
            from order_details_with_latest_status
            where LatestStatus = 'Pending'
        `;
        const [rows] = await pool.query(query);

        res.json(rows);
    } catch (e) {
        res.send('Failed to fetch pending trains');
    }
});

export default router;