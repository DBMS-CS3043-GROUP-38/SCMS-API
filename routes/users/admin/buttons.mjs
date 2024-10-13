import express from "express";
import pool from "../../../utilities/database/db.mjs";

const router = express.Router();

router.get('/test', (req, res) => {
    res.send('Admin dashboard route working');
});

router.post('/schedule-trains', async (req, res) => {
    try {
        const query = `
            select AddFutureTrains();
        `;
        const [rows] = await pool.query(query);
        res.json({message: 'Trains scheduled successfully', scheduled: rows[0]['AddFutureTrains()']});
    } catch (e) {
        console.error(e);
        res.status(500).json({error: 'Failed to schedule trains'});
    }
})

router.post('/schedule-orders', async (req, res) => {
    try {

        let ScheduledOrders = 0;
        const [orders] = await pool.query(`select * from order_details_with_latest_status where LatestStatus = 'Pending'`);
        const [trains] = await pool.query(`select * from train_schedule_with_destinations where Status = 'Not Completed' order by ScheduleDateTime`);
        const TotalOrders = orders.length;
        const TotalTrains = trains.length;

        if (orders.length === 0 || trains.length === 0) {
            return res.json({message: 'No pending orders or scheduled trains'});
        }

        //Looping through each order and assigning it to a train
        for (let i = 0; i < orders.length; i++) {
            for(let j = 0; j < trains.length; j++) {
                if (orders[i].TotalVolume <= trains[j].RemainingCapacity) {
                    const changeStatus = `
                        insert into order_tracking (OrderID, TimeStamp, Status) value (${orders[i].OrderID}, now(), 'PendingDispatch');
                    `;
                    await pool.query(changeStatus);
                    const assignATrain = `
                        insert into train_contains (TrainScheduleID, OrderID) VALUE (${trains[j].TrainScheduleID}, ${orders[i].OrderID});
                    `;
                    await pool.query(assignATrain);
                    ScheduledOrders++;
                    console.log(`Order ${orders[i].OrderID} scheduled to train ${trains[j].TrainScheduleID}`);
                    break;
                }
            }
        }
        let message = 'No orders could be scheduled might be due to insufficient capacity';
        if (ScheduledOrders > 0) {
            message = `${ScheduledOrders} out of ${TotalOrders} orders scheduled successfully`
        }
        res.json({message, ScheduledOrders});
    } catch (e) {
        console.error(e);
        res.status(500).json({error: 'Failed to schedule orders'});
    }
});

export default router;