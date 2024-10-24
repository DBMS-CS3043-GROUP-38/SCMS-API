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
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [orders] = await connection.query(`
            SELECT *
            FROM order_details_with_latest_status
            WHERE LatestStatus = 'Pending'
        `);
        const [trains] = await connection.query(`
            SELECT *
            FROM train_schedule_with_destinations
            WHERE Status = 'Not Completed'
            ORDER BY ScheduleDateTime
        `);

        const TotalOrders = orders.length;
        const TotalTrains = trains.length;

        if (TotalOrders === 0 || TotalTrains === 0) {
            return res.json({ message: 'No orders or trains to schedule', ScheduledOrders: 0 });
        }

        // Looping through each order and assigning it to a train
        for (let i = 0; i < TotalOrders; i++) {
            for (let j = 0; j < TotalTrains; j++) {
                // Break if train is not to destination
                if (orders[i].StoreCity !== trains[j].StoreCity) {
                    continue;
                }

                if (parseFloat(orders[i].TotalVolume) <= parseFloat(trains[j].RemainingCapacity)) {
                    const changeStatus = `
                        INSERT INTO order_tracking (OrderID, TimeStamp, Status)
                        VALUES (?, NOW(), 'PendingDispatch')
                    `;
                    await connection.query(changeStatus, [orders[i].OrderID]);

                    const assignATrain = `
                        INSERT INTO train_contains (TrainScheduleID, OrderID)
                        VALUES (?, ?)
                    `;
                    await connection.query(assignATrain, [trains[j].TrainScheduleID, orders[i].OrderID]);
                    ScheduledOrders++;

                    // Update the remaining capacity of the train
                    trains[j].RemainingCapacity = (parseFloat(trains[j].RemainingCapacity) - parseFloat(orders[i].TotalVolume)).toFixed(2);
                    break; // Break the inner loop since the order has been scheduled
                }
            }
        }

        if (ScheduledOrders > 0) {
            message = `${ScheduledOrders} out of ${TotalOrders} orders scheduled successfully.`;
        } else {
            message = 'No orders could be scheduled; might be due to insufficient capacity.';
        }

        await connection.commit(); // Commit transaction
        res.json({ message, ScheduledOrders });
    } catch (e) {
        console.error(e);
        await connection.rollback(); // Rollback transaction on error
        res.status(500).json({ error: 'Failed to schedule orders' });
    } finally {
        connection.release(); // Always release the connection back to the pool
    }
});

router.post('/dispatch-train/:trainID', async (req, res) => {
    const { trainID } = req.params;
    let dispatchedOrders = 0;
    let message = '';
    const connection = await pool.getConnection();

    console.log(`Dispatching train ${trainID}`);

    try {
        await connection.beginTransaction();

        const getOrders = `
            SELECT OrderID
            FROM train_contains
            WHERE TrainScheduleID = ?
        `;
        const [orders] = await connection.query(getOrders, [trainID]);
        const TotalOrders = orders.length;

        const setOrderStatus = `
            INSERT INTO order_tracking (OrderID, TimeStamp, Status)
            VALUES (?, NOW(), 'InTrain')
        `;
        const setTrainStatus = `
            UPDATE trainschedule
            SET Status = 'In Progress'
            WHERE TrainScheduleID = ?
        `;

        for (let i = 0; i < TotalOrders; i++) {
            await connection.query(setOrderStatus, [orders[i].OrderID]);
            dispatchedOrders++;
        }

        await connection.query(setTrainStatus, [trainID]);

        message = `Train ${trainID} dispatched with no orders.`;
        if (dispatchedOrders > 0) {
            message = `${dispatchedOrders} out of ${TotalOrders} orders dispatched with train schedule ${trainID}.`;
        }

        await connection.commit(); // Commit transaction
        res.json({ message, dispatchedOrders });
    } catch (e) {
        console.error(e);
        await connection.rollback(); // Rollback transaction on error
        res.status(500).json({ error: 'Failed to dispatch train' });
    } finally {
        connection.release(); // Always release the connection back to the pool
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

        const [rows] = await pool.query(orderInfo);
        if (rows.length === 0) {
            return res.json({message: 'Order not found'});
        }
        if (rows[0].TrainScheduleID !== null) {
            await pool.query(removeTrain);
            message = message + 'Order removed from train \n';
        }
        if (rows[0].ShipmentID !== null) {
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