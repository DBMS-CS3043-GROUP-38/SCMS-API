import pool from '../database/db.mjs';

async function addTruckSchedule() {
    try {
        const [shipments] = await pool.query(`
        select * from shipment
        `);

        for (const shipment of shipments) {
            const {ShipmentID, RouteID} = shipment;

            const [truck] = await pool.query(`
            select * from truck
            `)

            const [assistant] = await pool.query(`
            select * from assistant
            `)

            const [driver] = await pool.query(`
            select * from driver
            `)

            const randomTruck = truck[Math.floor(Math.random() * truck.length)];
            const randomAssistant = assistant[Math.floor(Math.random() * assistant.length)];
            const randomDriver = driver[Math.floor(Math.random() * driver.length)];

            const [route] = await pool.query(`
            select * from route where RouteID = ?
            `, [RouteID]);

            const StoreID = route[0].StoreID;
            const time = route[0].Time_duration;

            await pool.query(`
            insert into truckschedule(StoreID, ShipmentID, ScheduleDateTime, RouteID, AssistantID, DriverID, TruckID, Hours, Status) VALUE (?, ?, CURDATE(), ?, ?, ?, ?, ?, ?)
            `, [StoreID, ShipmentID, RouteID, randomAssistant.AssistantID, randomDriver.DriverID, randomTruck.TruckID, time, 'Completed']);
            console.log(`Shipment ${ShipmentID} added to truck schedule`);
        }
    } catch (e) {
        console.error(e);
    }
}

export default addTruckSchedule;