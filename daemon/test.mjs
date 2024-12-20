import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

// Helper function to check if a date is older than 7 days
function isOlderThan7Days(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const daysDifference = (now - date) / (1000 * 60 * 60 * 24);
    return daysDifference > 7;
}

function timeToSeconds(timeStr) {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
}

// Function to convert seconds to HH:MM:SS format
function secondsToTime(seconds) {
    const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
}

const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

connection.connect((err) => {
    if (err) {
        console.error("Error connecting to the database:", err.stack);
        return;
    }
});

try {
    // Update 'NotReady' shipments to 'Ready'
    const [shipments] = await connection.promise().query(`
        SELECT ShipmentID, CreatedDate, FilledCapacity, Capacity, RouteID
        FROM shipment
        WHERE Status = 'NotReady'
    `);

    for (let shipment of shipments) {
        if ((parseFloat(shipment.FilledCapacity) >= 0.001 * parseFloat(shipment.Capacity) || isOlderThan7Days(shipment.CreatedDate))) {
            await connection.promise().query(`
                UPDATE shipment
                SET Status = 'Ready'
                WHERE ShipmentID = ?
            `, [shipment.ShipmentID]);
        }
    }

    // Step 2: Assign 'Ready' shipments to trucks
    const [readyShipments] = await connection.promise().query(`
        SELECT s.ShipmentID, r.StoreID, s.RouteID
        FROM shipment s
        JOIN RouteStore r ON s.ShipmentID = r.ShipmentID
        WHERE s.Status = 'Ready'
    `);

    let RouteID = null;
    let shipmentDriver = null;
    let shipmentAssistant = null;
    let truckID = null;

    for (let shipment of readyShipments) {
        RouteID = null;
        shipmentDriver = null;
        shipmentAssistant = null;
        truckID = null;

        // Assign available truck at the StoreID
        const [trucks] = await connection.promise().query(`
            SELECT TruckID
            FROM truck
            WHERE Status = 'Available' AND StoreID = ?
            LIMIT 1
        `, [shipment.StoreID]);

        const [assistants] = await connection.promise().query(`
            SELECT AssistantID, CompletedHours
            FROM AvailableAssistants
            WHERE StoreID = ?
        `, [shipment.StoreID]);

        const [drivers] = await connection.promise().query(`
            SELECT DriverID, CompletedHours
            FROM AvailableDrivers 
            WHERE StoreID = ?
        `, [shipment.StoreID]);

        if (trucks.length === 0 || assistants.length === 0 || drivers.length === 0 || trucks.length === 0) {
            console.log(`No available truck, driver or assistant found for shipment ${shipment.ShipmentID}.`);
            continue;
        }


        RouteID = shipment.RouteID;
        truckID = trucks[0].TruckID;



        // Fetch the route duration
        const [route] = await connection.promise().query(`
            SELECT Time_duration
            FROM route
            WHERE RouteID = ?
        `, [RouteID]);

        const routeDuration = timeToSeconds(route[0].Time_duration);


        // Step 3: Assign driver and assistant according to roster rules



        for (let driver of drivers) {
            const [lastSchedule] = await connection.promise().query(`
                SELECT EndTime
                FROM TruckScheduleDetails
                WHERE DriverID = ?
                ORDER BY EndTime DESC
                LIMIT 1
            `, [driver.DriverID]);


            const now = new Date();
            const lastScheduleEndTime = lastSchedule.length ? new Date(lastSchedule[0].EndTime) : null;
            const hoursDifference = lastScheduleEndTime ? (now - lastScheduleEndTime) / (1000 * 60 * 60) : Infinity;

            if (hoursDifference >= 4 && timeToSeconds(driver.CompletedHours) + routeDuration <= 3600*40) {

                shipmentDriver = driver;
                break;
            }
        }


        for (let assistant of assistants) {
            const [lastEntries] = await connection.promise().query(`
                SELECT StartTime, EndTime
                FROM TruckScheduleDetails
                WHERE AssistantID = ?
                ORDER BY EndTime DESC
                LIMIT 2
            `, [assistant.AssistantID]);

            if (lastEntries.length < 2 && timeToSeconds(assistant.CompletedHours) + routeDuration <= 60*3600) {

                shipmentAssistant = assistant;
                break;
            }

            const now = new Date();
            if (lastEntries.length === 2) {
                const timeGap = (new Date(lastEntries[0].StartTime) - new Date(lastEntries[1].EndTime)) / (1000 * 60 * 60);
                const timeGapTillCurrentTime = (now - new Date(lastEntries[0].EndTime)) / (1000 * 60 * 60);
                if (timeGap >= 3 && timeToSeconds(assistant.CompletedHours) + routeDuration <= 60*3600 && timeGapTillCurrentTime >= 3) {
                    shipmentAssistant = assistant;
                    break;
                }
            }
        }

        if (!shipmentDriver || !shipmentAssistant || !truckID) {
            console.log(`No available driver, assistant or truck found for shipment ${shipment.ShipmentID}.`);
            console.log(`Driver: ${shipmentDriver}, Assistant: ${shipmentAssistant}, Truck: ${truckID}`);
            continue;
        }

        await connection.promise().query(`
            UPDATE truck
            SET Status = 'Busy'
            WHERE TruckID = ?
        `, [truckID]);

        await connection.promise().query(`
            UPDATE driver
            SET Status = 'Busy'
            WHERE DriverID = ?
        `, [shipmentDriver.DriverID]);

        await connection.promise().query(`
            UPDATE assistant
            SET Status = 'Busy'
            WHERE AssistantID = ?
        `, [shipmentAssistant.AssistantID]);

        await connection.promise().query(`
            INSERT INTO truckschedule (TruckID, DriverID, AssistantID, ShipmentID, ScheduleDateTime, StoreID, Hours, Status, RouteID)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Not Completed', ?)
        `, [
            truckID,
            shipmentDriver.DriverID,
            shipmentAssistant.AssistantID,
            shipment.ShipmentID,
            new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),  // ScheduleDateTime in UTC
            shipment.StoreID,
            secondsToTime(routeDuration),  // Hours in HH:MM:SS format
            RouteID
        ]);

        console.log(`Driver ${shipmentDriver.DriverID} and assistant ${shipmentAssistant.AssistantID} assigned to truck ${truckID} to deliver shipment ${shipment.ShipmentID}.`);
    }
} catch (error) {
    console.error("Error executing truck scheduling task:", error);
} finally {
    connection.end();
}
