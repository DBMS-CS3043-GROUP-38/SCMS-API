// current-time.js
import mysql from "mysql2";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

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

const futureDate = new Date(Date.now())
    .toISOString()


console.log(`Current date: ${futureDate}`);

const query = `
    UPDATE truckschedule
    SET ScheduleDateTime = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 2 HOUR )
    WHERE TruckScheduleID = 11;
`;


try {
    connection.query(query, [futureDate], (err, results) => {
        if (err) {
            console.error('Error updating schedule:', err.stack);
            return;
        }
        console.log('Schedule updated successfully');
    });
} catch (e) {
    console.error('Error updating schedule:', e.stack);
} finally {
    connection.end();
}
