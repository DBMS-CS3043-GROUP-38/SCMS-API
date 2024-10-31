// Import required modules
import cron from 'node-cron';
import mysql from 'mysql2';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a MySQL connection
const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

// Connect to the database
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
    }
});

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

// Cron job to run every minute
cron.schedule('* * * * *', async () => {
    console.log('Running truck scheduling task');

    try {
        // Start a transaction
        await connection.promise().query('START TRANSACTION');


        // Step 1: Assign 'Ready' shipments to trucks
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
                WHERE Status = 'Available'
                  AND StoreID = ?
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

            // Step 2: Assign driver and assistant according to roster rules
            for (let driver of drivers) {
                const [lastSchedule] = await connection.promise().query(`
                    SELECT EndTime
                    FROM truck_schedule_with_details
                    WHERE DriverID = ?
                    ORDER BY EndTime DESC
                    LIMIT 1
                `, [driver.DriverID]);

                const now = new Date();
                const lastScheduleEndTime = lastSchedule.length ? new Date(lastSchedule[0].EndTime) : null;
                const hoursDifference = lastScheduleEndTime ? (now - lastScheduleEndTime) / (1000 * 60 * 60) : Infinity;

                if (hoursDifference >= 6 && timeToSeconds(driver.CompletedHours) + routeDuration <= 3600 * 40) {
                    shipmentDriver = driver;
                    break;
                }
            }

            for (let assistant of assistants) {
                const [lastEntries] = await connection.promise().query(`
                    SELECT ScheduleDateTime, EndTime
                    FROM truck_schedule_with_details
                    WHERE AssistantID = ?
                    ORDER BY EndTime DESC
                    LIMIT 2
                `, [assistant.AssistantID]);

                if (lastEntries.length < 2 && timeToSeconds(assistant.CompletedHours) + routeDuration <= 60 * 3600) {
                    shipmentAssistant = assistant;
                    break;
                }

                const now = new Date();
                if (lastEntries.length === 2) {
                    const timeGap = (new Date(lastEntries[0].StartTime) - new Date(lastEntries[1].EndTime)) / (1000 * 60 * 60);
                    const timeGapTillCurrentTime = (now - new Date(lastEntries[0].EndTime)) / (1000 * 60 * 60);
                    if (timeGap >= 6 && timeToSeconds(assistant.CompletedHours) + routeDuration <= 60 * 3600 && timeGapTillCurrentTime >= 3) {
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
                INSERT INTO truckschedule (TruckID, DriverID, AssistantID,ScheduleDateTime, ShipmentID,
                                           Status)
                VALUES (?, ?, ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 2 HOUR ), ?,'Not Completed')
            `, [
                truckID,
                shipmentDriver.DriverID,
                shipmentAssistant.AssistantID,
                shipment.ShipmentID,
                shipment.StoreID,
                secondsToTime(routeDuration),  // Hours in HH:MM:SS format
                RouteID
            ]);

            await connection.promise().query(`
                UPDATE Shipment AS sh
                SET Status = 'Completed'
                WHERE sh.ShipmentID = ?
            `, [shipment.ShipmentID]);

            console.log(`Driver ${shipmentDriver.DriverID} and assistant ${shipmentAssistant.AssistantID} assigned to truck ${truckID} to deliver shipment ${shipment.ShipmentID}.`);
        }

        // Commit the transaction
        await connection.promise().query('COMMIT');

    } catch (error) {
        // Rollback the transaction in case of error
        await connection.promise().query('ROLLBACK');
        console.error("Error executing truck scheduling task:", error);
    }
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('Closing the database connection');
    connection.end((err) => {
        if (err) {
            console.error('Error closing the connection:', err.stack);
        }
        process.exit();
    });
});
