import pool from '../database/db.mjs';

async function addShipment(order) {
    const {OrderID, TotalVolume, RouteID} = order;
    try {
        let query = `
            SELECT *
            FROM shipment
            WHERE RouteID = ?;
        `;
        const [rows] = await pool.query(query, [RouteID]);

        let shipmentID = null;

        let shipmentAssigned = false;

        if (rows.length === 0) {
            // No existing shipment found for the route
            query = `
                INSERT INTO shipment(CreatedDate, Capacity, FilledCapacity, Status, RouteID)
                VALUES (CURDATE(), 250, ?, 'Completed', ?);
            `;
            const [result] = await pool.query(query, [TotalVolume, RouteID]);
            shipmentID = result.insertId;

            query = `
                INSERT INTO shipment_contains(ShipmentID, OrderID)
                VALUES (?, ?);
            `;
            await pool.query(query, [shipmentID, OrderID]);
            shipmentAssigned = true;
            console.log(`Order ${OrderID} added to shipment ${shipmentID}`);
        } else {
            // Existing shipments found
            for (const row of rows) {
                if (row.Capacity - row.FilledCapacity >= TotalVolume) {
                    shipmentID = row.ShipmentID;

                    query = `
                        UPDATE shipment
                        SET FilledCapacity = FilledCapacity + ?
                        WHERE ShipmentID = ?;
                    `;
                    await pool.query(query, [TotalVolume, shipmentID]);

                    query = `
                        INSERT INTO shipment_contains(ShipmentID, OrderID)
                        VALUES (?, ?);
                    `;
                    await pool.query(query, [shipmentID, OrderID]);
                    console.log(`Order ${OrderID} added to existing shipment ${shipmentID}`);
                    shipmentAssigned = true;
                    break;
                }
            }
        }
        if (!shipmentAssigned) {
            query = `
                INSERT INTO shipment(CreatedDate, Capacity, FilledCapacity, Status, RouteID)
                VALUES (CURDATE(), 250, ?, 'Completed', ?);
            `;
            const [result] = await pool.query(query, [TotalVolume, RouteID]);
            shipmentID = result.insertId;

            query = `
                INSERT INTO shipment_contains(ShipmentID, OrderID)
                VALUES (?, ?);
            `;
            await pool.query(query, [shipmentID, OrderID]);
            console.log(`Order ${OrderID} added to new shipment ${shipmentID}`);
        }
    } catch
        (e) {
        console.error('Error adding shipment:', e);
    }
}

async function loadOrders() {
    try {
        const query = `
            SELECT *
            FROM \`order\`;
        `;
        const [rows] = await pool.query(query);
        return rows;
    } catch (e) {
        console.error('Error loading orders:', e);
        return [];
    }
}

async function createShipment() {
    try {
        const orders = await loadOrders();
        for (const order of orders) {
            await addShipment(order);
        }
    } catch (e) {
        console.error('Error creating shipments:', e);
    }
}

export default createShipment;