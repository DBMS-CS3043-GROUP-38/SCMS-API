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
    let ScheduledOrders = 0;
    let message = '';
    try {

        const [orders] = await pool.query(`select *
                                           from order_details_with_latest_status
                                           where LatestStatus = 'Pending'`);
        const [trains] = await pool.query(`select *
                                           from train_schedule_with_destinations
                                           where Status = 'Not Completed'
                                           order by ScheduleDateTime`);
        const TotalOrders = orders.length;
        const TotalTrains = trains.length;

        if (orders.length === 0 || trains.length === 0) {
            return res.json({message: 'No orders or trains to schedule', ScheduledOrders: 0});
        }

        //Looping through each order and assigning it to a train
        for (let i = 0; i < TotalOrders; i++) {
            console.log(`Processing order ${orders[i].OrderID} with volume ${orders[i].TotalVolume}`);
            for (let j = 0; j < TotalTrains; j++) {
                //Break if train is not to destination
                if (orders[i].StoreCity !== trains[j].StoreCity) {
                    console.log(`Order ${orders[i].OrderID} is not for train ${trains[j].TrainScheduleID}`);
                    continue;
                }
                console.log(`Checking train ${trains[j].TrainScheduleID} with remaining capacity ${trains[j].RemainingCapacity}`);
                if (parseFloat(orders[i].TotalVolume) <= parseFloat(trains[j].RemainingCapacity)) {
                    console.log(`Order ${orders[i].OrderID} can be scheduled to train ${trains[j].TrainScheduleID}`);
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
                    //Update the remaining capacity of the train in local variable
                    trains[j].RemainingCapacity = (parseFloat(trains[j].RemainingCapacity) - parseFloat(orders[i].TotalVolume)).toFixed(2);

                    break;
                }
                console.log(`Order ${orders[i].OrderID} cannot be scheduled to train ${trains[j].TrainScheduleID}`);
            }
        }
        message = 'No orders could be scheduled might be due to insufficient capacity';
        if (ScheduledOrders > 0) {
            message = `${ScheduledOrders} out of ${TotalOrders} orders scheduled successfully`
        }
        res.json({message, ScheduledOrders});
    } catch (e) {
        console.error(e);
        res.status(500).json({error: 'Failed to schedule orders'});
    }
});

router.post('/dispatch-train/:trainID', async (req, res) => {
    const {trainID} = req.params;
    let dispatchedOrders = 0;
    let message = '';
    console.log(`Dispatching train ${trainID}`);
    try {
        const getOrders = `
            select OrderID
            from train_contains
            where TrainScheduleID = ${trainID};
        `;
        const setOrderStatus = `
            insert into order_tracking(OrderID, TimeStamp, Status) VALUE (?, now(), 'InTrain');
        `;
        const setTrainStatus = `
            update trainschedule
            set Status = 'In Progress'
            where TrainScheduleID = ${trainID};
        `;

        const [orders] = await pool.query(getOrders);
        const TotalOrders = orders.length;
        for (let i = 0; i < TotalOrders; i++) {
            await pool.query(setOrderStatus, [orders[i].OrderID]);
            dispatchedOrders++;
        }
        await pool.query(setTrainStatus);

        message = `Train ${trainID} dispatched with No orders`;
        if (dispatchedOrders > 0) {
            message = `${dispatchedOrders} out of ${TotalOrders} orders dispatched with trainSchedule ${trainID}`;
        }
        res.json({message, dispatchedOrders});
    } catch (e) {
        console.error(e);
        res.status(500).json({error: 'Failed to dispatch train'});
    }
});


router.patch('/report-order/:orderID', async (req, res) => {
    try {
        let message = '';
        const {orderID} = req.params;
        const orderInfo = `
            select TotalVolume, ShipmentID, TrainScheduleID
            from order_details_with_latest_status
            where OrderID = ${orderID}
              and LatestStatus not in ('Attention', 'Delivered', 'Cancelled');
        `;
        const tracking =
            `            insert into order_tracking (OrderID, TimeStamp, Status) value (${orderID}, now(), 'Attention');
            `;
        const removeTrain =
            `delete
             from train_contains
             where OrderID = ${orderID};`
        ;
        const removeShipment =
            `delete
             from shipment_contains
             where OrderID = ${orderID};`
        ;
        const updateSpaceTrain =
            `update trainschedule
             set FilledCapacity = FilledCapacity - ?
             where TrainScheduleID = ?;`;

        const updateSpaceShipment =
            `update shipment
             set FilledCapacity = FilledCapacity - ?
             where ShipmentID = ?;`;


        const [rows] = await pool.query(orderInfo);
        if (rows.length === 0) {
            return res.json({message: 'Order not found'});
        }
        if (rows[0].TrainScheduleID !== null) {
            await pool.query(updateSpaceTrain, [rows[0].TotalVolume, rows[0].TrainScheduleID]);
            await pool.query(removeTrain);
            message = message + 'Order removed from train \n';
        }
        if (rows[0].ShipmentID !== null) {
            await pool.query(updateSpaceShipment, [rows[0].TotalVolume, rows[0].ShipmentID]);
            await pool.query(removeShipment);
            message = message + 'Order removed from shipment \n';
        }
        await pool.query(tracking);
        message = message + 'Order status changed to Attention';
        res.json({message});
    } catch (e) {
        console.error(e);
        res.status(500).json({error: 'Failed to update order status'});
    }
});


router.patch('/cancel-order/:orderID', async (req, res) => {
        try {
            const {orderID} = req.params;
            const query = `
                insert into order_tracking (OrderID, TimeStamp, Status) value (?, now(), 'Cancelled');
            `;

            await pool.query(query, [orderID]);
            res.json({message: `Order ${orderID} cancelled successfully}`});
        } catch (e) {
            console.error(e);
            res.status(500).json({error: 'Failed to cancel order'});
        }
    }
)
;

export default router;