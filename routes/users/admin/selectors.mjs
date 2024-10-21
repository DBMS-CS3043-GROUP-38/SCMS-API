import express from "express";
import pool from "../../../utilities/database/db.mjs";

const router = express.Router();

router.get('/test', (req, res) => {
    res.send('Admin dashboard route working');
});


router.get('/today-trains', async (req, res) => {
    try {
        const query = `
            select 
                TrainScheduleID as trainID,
                DATE_FORMAT(ScheduleDateTime, '%a %T') as Time,
                StoreCity as Destination
            from 
                train_schedule_with_destinations 
            where DATE(ScheduleDateTime) <= CURDATE() and Status = 'Not Completed' order by ScheduleDateTime;
        `;

        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({error: 'Failed to fetch trains today'});
    }
});

router.get('/available-years', async (req, res) => {
    try {
        const query = `
            select distinct YEAR(OrderDate) as Year
            from order_details_with_latest_status
            order by Year desc;
        `;
        const [rows] = await pool.query(query);
        console.log(`Fetched years: ${JSON.stringify(rows)}`);
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({error: 'Failed to fetch available years'});
    }
})

router.get('/available-quarters/:year', async (req, res) => {
    try {
        const query = `
            select distinct QUARTER(OrderDate) as Quarter
            from order_details_with_latest_status
            where YEAR(OrderDate) = ?
            order by Quarter desc;
        `;
        const [rows] = await pool.query(query, [req.params.year]);
        console.log(`Fetched quarters for year ${req.params.year}: ${JSON.stringify(rows)}`);
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({error: 'Failed to fetch available quarters'});
    }
});

router.get('/get-stores', async (req, res) => {
    try {
        const query = `
            select StoreID, City
            from store;
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({error: 'Failed to fetch stores'});
    }
});


export default router;