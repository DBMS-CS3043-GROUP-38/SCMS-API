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
    let AddedOrders = 0;
    let message = '';
    const StoreID = req.user.StoreID;
    try {
        // Implement the bundle orders into shipments functionality here
        const loadOrders = `
            select * from order_details_with_latest_status where LatestStatus = 'InStore' and StoreID = ${StoreID};
        `;
        const getShipment = `
            select * from shipment where RouteID = ? and Status = 'NotReady';
         `;
        const createShipment = `
            insert into shipment (CreatedDate, Capacity, RouteID, FilledCapacity, Status) VALUE (now(), 250, ?, 0, 'NotReady');
        `;
        const addOrderToShipment = `
            insert into shipment_contains (ShipmentID, OrderID) VALUE (?, ?);
        `
        const createRecord = `
        insert into order_tracking (OrderID, TimeStamp, Status) VALUE (?, now(), 'InShipment');
        `
        const [orders] = await pool.query(loadOrders);
        console.log(orders);
        if (orders.length === 0) {
            return res.json({message: 'No orders to bundle', AddedOrders: 0});
        }
        for (let i = 0; i < orders.length; i++) {
            const [shipments] = await pool.query(getShipment, orders[i].RouteID);
            let orderAdded = false;
            for (let j = 0; j < shipments.length; j++) {
                if (shipments[j].FilledCapacity + orders[i].TotalVolume <= shipments[j].Capacity) {
                    await pool.query(addOrderToShipment, [shipments[j].ShipmentID, orders[i].OrderID]);
                    await pool.query(createRecord, [orders[i].OrderID]);
                    orderAdded = true;
                    message = message + `Order ${orders[i].OrderID} added to existing shipment ${shipments[j].ShipmentID} \n`;
                    AddedOrders++;
                    break;
                }
            }
            if (!orderAdded) {
                const [shipment] = await pool.query(createShipment, orders[i].RouteID);
                await pool.query(addOrderToShipment, [shipment.insertId, orders[i].OrderID]);
                await pool.query(createRecord, [orders[i].OrderID]);
                message = message + `Order ${orders[i].OrderID} added to new shipment ${shipment.insertId} \n`;
                AddedOrders++;
            }
        }

        res.json({message, AddedOrders});
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