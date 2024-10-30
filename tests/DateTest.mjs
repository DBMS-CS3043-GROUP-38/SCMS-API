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

const futureDate = new Date(Date.now() + 12 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');

console.log("10 hours from now:", futureDate);

const query = `
    UPDATE truckschedule SET ScheduleDateTime = ? WHERE TruckScheduleID = 11;
`;

connection.query(query, [futureDate], (err, results) => {
    if (err) {
        console.error('Error updating schedule:', err.stack);
        return;
    }
    console.log('Schedule updated successfully');
});
