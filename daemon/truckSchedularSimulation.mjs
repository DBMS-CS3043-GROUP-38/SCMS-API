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
        return;
    }
});

// Utility function to check if a date is at least 7 days old
function isOlderThan7Days(date) {
    const now = new Date();
    const shipmentDate = new Date(date);
    const diffTime = Math.abs(now - shipmentDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 7;
}

// Cron job to run every minute
cron.schedule('* * * * *', async () => {
    console.log('Running truck scheduling task');

    try {
        // Update 'notReady' shipments to 'ready'
        const [shipments] = await connection.promise().query(`
            SELECT ShipmentID, CreateDate, FilledCapacity, Capacity
            FROM shipment
            WHERE Status = 'NotReady'
        `);

        for (let shipment of shipments) {
            if (shipment.FilledCapacity >= 0.8 * shipment.Capacity || isOlderThan7Days(shipment.CreateDate)) {
                await connection.promise().query(`
                    UPDATE shipment
                    SET Status = 'Ready'
                    WHERE ShipmentID = ?
                `, [shipment.ShipmentID]);
            }
        }

        // Step 2: Assign 'ready' shipments to trucks
        await connection.promise().query(`
            CREATE OR REPLACE VIEW RouteStore AS
            SELECT s.ShipmentID, r.StoreID
            FROM shipment s
            JOIN route r ON s.RouteID = r.RouteID
        `);

        const [readyShipments] = await connection.promise().query(`
            SELECT s.ShipmentID, r.StoreID
            FROM shipment s
            JOIN RouteStore r ON s.ShipmentID = r.ShipmentID
            WHERE s.Status = 'Ready'
        `);

        for (let shipment of readyShipments) {
            // Assign available truck at the StoreID
            const [trucks] = await connection.promise().query(`
                SELECT TruckID
                FROM truck
                WHERE Status = 'Available' AND StoreID = ?
                LIMIT 1
            `, [shipment.StoreID]);

            if (trucks.length === 0) {
                console.log(`No available trucks at store ${shipment.StoreID}`);
                continue;
            }
            
            const TruckID = trucks[0].TruckID;
            await connection.promise().query(`
                UPDATE truck
                SET Status = 'Busy'
                WHERE TruckID = ?
            `, [TruckID]);

            //console.log(`Shipment ${shipment.ShipmentID} assigned to truck ${TruckID}`);

            //fetches the time to complete the route
            const [route] = await connection.promise().query(`
                SELECT Time_duration
                FROM route
                WHERE RouteID = (SELECT RouteID FROM shipment WHERE ShipmentID = ?)
            `, [shipment.ShipmentID]);

            const routeDuration = route[0].Time_duration;

            // Step 3: Assign driver and assistant according to roster rules

            await connection.promise().query(`
                CREATE OR REPLACE VIEW AvailableDrivers AS
                SELECT d.DriverID, e.EmployeeID, d.CompletedHours
                FROM driver d
                JOIN employees e ON d.EmployeeID = e.EmployeeID
                WHERE d.Status = 'Available' AND d.CompletedHours <= 40
                AND e.StoreID = ? AND NOT EXISTS (
                    SELECT 1
                    FROM truckschedule ts
                    WHERE ts.DriveID = AvailableDrivers.DriveID
                    ORDER BY ts.ScheduleDateTime DESC
                    LIMIT 1
                )
            `, [shipment.StoreID]);

            const [drivers] = await connection.promise().query(`
                SELECT DriveID
                FROM AvailableDrivers
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM truckschedule ts
                    WHERE ts.DriveID = AvailableDrivers.DriveID
                    ORDER BY ts.ScheduleDateTime DESC
                    LIMIT 1
                )
            `);

            const [assistants] = await connection.promise().query(`
                SELECT AssistantID
                FROM assistant
                WHERE Status = 'Available' AND CompletedHours <= 60
                AND (
                    SELECT COUNT(*)
                    FROM truckschedule ts
                    WHERE ts.AssistantID = assistant.AssistantID
                    ORDER BY ts.ScheduleDateTime DESC
                    LIMIT 2
                ) < 2
            `);

            if (drivers.length === 0 || assistants.length === 0) {
                console.log(`No available driver or assistant for shipment ${shipment.ShipmentID}`);
                continue;
            }
            
            let shipmentDriver,shipmentAssistant;

            for(let driver of drivers){
                if(driver.CompletedHours + routeDuration <= 40){
                    await connection.promise().query(`
                        UPDATE driver
                        SET Status = 'Busy'
                        WHERE DriverID = ?
                    `, [routeDuration,driver.DriverID]);
                }

                shipmentDriver = driver;

                break;
            }

            for(let assistant of assistants){
                if(assistant.CompletedHours + routeDuration <= 60){
                    await connection.promise().query(`
                        UPDATE assistant
                        SET Status = 'Busy'
                        WHERE AssistantID = ?
                    `, [routeDuration,assistant.AssistantID]);
                }

                shipmentAssistant = assistant;

                break;
            }

            const date = new Date();

            // Assign to the truck schedule
            await connection.promise().query(`
                INSERT INTO truckschedule (TruckID, DriveID, AssistantID, ShipmentID, ScheduleDateTime, StoreID, Hours, Status)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'Not Completed')
            `, [TruckID, shipmentDriver.DriveID, shipmentAssistant.AssistantID, shipment.ShipmentID, date, shipment.StoreID, routeDuration]);

            console.log(`Driver ${shipmentDriver.DriveID} and assistant ${shipmentAssistant.AssistantID} assigned to truck ${TruckID} to deliver the shipment ${shipment.ShipmentID}. `);

            // await connection.promise().query(`
            //     UPDATE driver
            //     SET completedHours = completedHours + ?
            //     WHERE DriveID = ?
            // `, [routeDuration, driver[0].DriveID]);

            // await connection.promise().query(`      
            //     UPDATE assistant
            //     SET completedHours = completedHours + ?
            //     WHERE AssistantID = ?
            // `, [routeDuration, assistant[0].AssistantID]);

            // console.log(`Updated work hours for driver ${driver[0].DriveID} and assistant ${assistant[0].AssistantID}`);
        }
    } catch (error) {
        console.error('Error executing truck scheduling task:', error);
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