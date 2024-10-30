import express from "express";
import pool from "../../../utilities/database/db.mjs";

const router = express.Router();

router.get('/test', (req, res) => {
    res.send('Admin dashboard route working');
});

router.post('/bundle-orders', async (req, res) => {
    const connection = await pool.getConnection();
    let AddedOrders = 0;
    let message = '';
    const StoreID = req.user.StoreID;

    try {
        await connection.beginTransaction();

        const loadOrders = `
            select * from order_details_with_latest_status
            where LatestStatus = 'InStore' and StoreID = ${StoreID};
        `;
        const [orders] = await connection.query(loadOrders);
        if (orders.length === 0) {
            await connection.rollback();
            return res.json({message: 'No orders to bundle', AddedOrders: 0});
        }

        const getShipment = `select * from shipment where RouteID = ? and Status = 'NotReady';`;
        const createShipment = `
            insert into shipment (CreatedDate, Capacity, RouteID, FilledCapacity, Status)
            VALUES (now(), 250, ?, 0, 'NotReady');
        `;
        const addOrderToShipment = `insert into shipment_contains (ShipmentID, OrderID) VALUES (?, ?)`;
        const createRecord = `insert into order_tracking (OrderID, TimeStamp, Status) VALUES (?, now(), 'InShipment')`;

        for (let order of orders) {
            const [shipments] = await connection.query(getShipment, order.RouteID);
            let orderAdded = false;

            for (let shipment of shipments) {
                if (parseFloat(shipment.FilledCapacity) + parseFloat(order.TotalVolume) <= parseFloat(shipment.Capacity)) {
                    await connection.query(addOrderToShipment, [shipment.ShipmentID, order.OrderID]);
                    await connection.query(createRecord, [order.OrderID]);
                    orderAdded = true;
                    message += `Order ${order.OrderID} added to existing shipment ${shipment.ShipmentID}, `;
                    AddedOrders++;
                    break;
                }
            }

            if (!orderAdded) {
                const [newShipment] = await connection.query(createShipment, order.RouteID);
                await connection.query(addOrderToShipment, [newShipment.insertId, order.OrderID]);
                await connection.query(createRecord, [order.OrderID]);
                message += `Order ${order.OrderID} added to new shipment ${newShipment.insertId}, `;
                AddedOrders++;
            }
        }

        await connection.commit();
        res.json({message: message.slice(0, -2), AddedOrders});
    } catch (e) {
        await connection.rollback();
        console.error(e);
        res.status(500).json({error: 'Failed to bundle orders'});
    } finally {
        connection.release();
    }
});

router.post('/receive-train/:trainID', async (req, res) => {
    const { trainID } = req.params;
    const connection = await pool.getConnection();
    let dispatchedOrders = 0;
    let message = '';

    try {
        await connection.beginTransaction();

        const getOrders = `
            select OrderID
            from train_contains
            where TrainScheduleID = ${trainID};
        `;
        const setOrderStatus = `
            insert into order_tracking(OrderID, TimeStamp, Status) VALUES (?, now(), 'InStore');
        `;
        const setTrainStatus = `
            update trainschedule
            set Status = 'Completed'
            where TrainScheduleID = ${trainID};
        `;

        const [orders] = await connection.query(getOrders);
        const TotalOrders = orders.length;
        for (let order of orders) {
            await connection.query(setOrderStatus, [order.OrderID]);
            dispatchedOrders++;
        }
        await connection.query(setTrainStatus);

        await connection.commit();
        message = dispatchedOrders > 0
            ? `${dispatchedOrders} out of ${TotalOrders} orders received with trainSchedule ${trainID}`
            : `Train ${trainID} received with no orders`;

        res.json({message, dispatchedOrders});
    } catch (e) {
        await connection.rollback();
        console.error(e);
        res.status(500).json({error: 'Failed to receive train'});
    } finally {
        connection.release();
    }
});

router.patch('/report-order/:orderID', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        let message = [];
        const { orderID } = req.params;

        const orderInfo = `
            select TotalVolume, ShipmentID, TrainScheduleID
            from order_details_with_latest_status
            where OrderID = ? and LatestStatus not in ('Attention', 'Delivered', 'Cancelled');
        `;
        const [rows] = await connection.query(orderInfo, [orderID]);

        if (rows.length === 0) {
            await connection.rollback();
            return res.json({message: 'Order not found or not eligible'});
        }

        if (rows[0].TrainScheduleID !== null) {
            const removeTrain = `delete from train_contains where OrderID = ?;`;
            await connection.query(removeTrain, [orderID]);
            message.push('Order removed from train');
        }

        if (rows[0].ShipmentID !== null) {
            const removeShipment = `delete from shipment_contains where OrderID = ?;`;
            await connection.query(removeShipment, [orderID]);
            message.push('Order removed from shipment');
        }

        const tracking = `
            insert into order_tracking (OrderID, TimeStamp, Status)
            VALUES (?, now(), 'Attention');
        `;
        await connection.query(tracking, [orderID]);
        message.push('Order status changed to Attention');

        await connection.commit();
        res.json({message: message.join(', ')});
    } catch (e) {
        await connection.rollback();
        console.error(e);
        res.status(500).json({error: 'Failed to update order status'});
    } finally {
        connection.release();
    }
});


export default router;