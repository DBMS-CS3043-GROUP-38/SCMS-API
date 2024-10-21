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

router.post('/bundle-orders', async (req, res) => {
    let ScheduledOrders = 0;
    let message = '';
    const StoreID = req.user.StoreID;
    try {
        // Implement the bundle orders into shipments functionality here
        res.json({message, ScheduledOrders});
    } catch (e) {
        console.error(e);
        res.status(500).json({error: 'Failed to schedule orders'});
    }
});

router.post('/receive-train/:trainID', async (req, res) => {
    const {trainID} = req.params;
    let dispatchedOrders = 0;
    let message = '';
    console.log(`Receiving train ${trainID}`);
    try {
        const getOrders = `
            select OrderID
            from train_contains
            where TrainScheduleID = ${trainID};
        `;
        const setOrderStatus = `
            insert into order_tracking(OrderID, TimeStamp, Status) VALUE (?, now(), 'InStore');
        `;
        const setTrainStatus = `
            update trainschedule
            set Status = 'Completed'
            where TrainScheduleID = ${trainID};
        `;

        const [orders] = await pool.query(getOrders);
        const TotalOrders = orders.length;
        for (let i = 0; i < TotalOrders; i++) {
            await pool.query(setOrderStatus, [orders[i].OrderID]);
            dispatchedOrders++;
        }
        await pool.query(setTrainStatus);

        message = `Train ${trainID} received with No orders`;
        if (dispatchedOrders > 0) {
            message = `${dispatchedOrders} out of ${TotalOrders} orders received with trainSchedule ${trainID}`;
        }
        res.json({message, dispatchedOrders});
    } catch (e) {
        console.error(e);
        res.status(500).json({error: 'Failed to receive train'});
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