import express from "express";
import pool from "../../../utilities/database/db.mjs";

const router = express.Router();

router.get('/test', (req, res) => {
    res.send('Admin dashboard route working');
});

router.post('/schedule-trains', async (req, res) => {
    try {
        const query = 'SELECT AddFutureTrains() AS result';
        const [rows] = await pool.query(query);
        
        const resultString = rows[0].result;
        
        // Updated regex pattern to match the new format
        const regex = /Schedules added from (\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2}): (\d+)/;
        const matches = resultString.match(regex);
        
        if (matches) {
            const [, startDate, endDate, schedulesAdded] = matches;
            
            res.json({
                message: 'Trains scheduled successfully',
                startDate: startDate,
                endDate: endDate,
                scheduled: parseInt(schedulesAdded)
            });
        } else {
            // In case the regex doesn't match
            res.json({
                message: 'Trains scheduled successfully',
                rawResult: resultString,
                startDate: null,
                endDate: null,
                scheduled: 0
            });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to schedule trains' });
    }
});


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
    const connection = await pool.getConnection(); // Get a connection for transaction
    try {
        let message = [];
        const { orderID } = req.params;

        await connection.beginTransaction(); // Start transaction

        const orderInfo = `
            SELECT TotalVolume, ShipmentID, TrainScheduleID
            FROM order_details_with_latest_status
            WHERE OrderID = ?
              AND LatestStatus NOT IN ('Attention', 'Delivered', 'Cancelled');
        `;
        const [rows] = await connection.query(orderInfo, [orderID]);

        if (rows.length === 0) {
            await connection.rollback(); // Rollback if no eligible order is found
            return res.json({ message: 'Order not found or not eligible' });
        }

        // Delete from train_contains and shipment_contains, triggers handle capacity
        if (rows[0].TrainScheduleID !== null) {
            const removeTrain = `DELETE FROM train_contains WHERE OrderID = ?;`;
            await connection.query(removeTrain, [orderID]);
            message.push('Order removed from train');
        }

        if (rows[0].ShipmentID !== null) {
            const removeShipment = `DELETE FROM shipment_contains WHERE OrderID = ?;`;
            await connection.query(removeShipment, [orderID]);
            message.push('Order removed from shipment');
        }

        // Update order status in order_tracking table
        const tracking = `
            INSERT INTO order_tracking (OrderID, TimeStamp, Status)
            VALUES (?, NOW(), 'Attention');
        `;
        await connection.query(tracking, [orderID]);
        message.push('Order status changed to Attention');

        await connection.commit(); // Commit transaction
        res.json({ message: message.join(', ') }); // Send message as comma-separated string
    } catch (error) {
        await connection.rollback(); // Rollback transaction on error
        console.error(error);
        res.status(500).json({ error: 'Failed to update order status' });
    } finally {
        connection.release(); // Release connection back to pool
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