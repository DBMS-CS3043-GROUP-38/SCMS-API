// Import the required modules
import cron from 'node-cron';
import mysql from 'mysql2';
import dotenv from 'dotenv';

// Load environment variables from a .env file
dotenv.config();


// Create a MySQL connection
const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Connect to the database
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
        return;
    }
    console.log('Connected to the database');
});

// Schedule a task to run every minute
cron.schedule('* * * * *', async () => {
    console.log('Running a task every minute');

    // Define your SQL query
    const getCustomerCount = `select count(*) as count
                              from customer`;
    const getRouteCount = `select count(*) as count
                           from route`;
    const getProductCount = `select count(*) as count
                             from product`;
    const createOrder = `
        INSERT INTO \`order\` (CustomerID, Value, OrderDate, DeliveryDate, RouteID, TotalVolume)
        VALUES (?, 0, CURDATE(), NULL, ?, 0);
    `
    const addingProducts = `
        insert into contains (OrderID, ProductID, Amount) VALUE (?, ?, ?)
    `

    // Execute the query
    try {
        const [customerCount] = await connection.promise().query(getCustomerCount);
        const [routeCount] = await connection.promise().query(getRouteCount);
        const [productCount] = await connection.promise().query(getProductCount);

        const [orderResult] = await connection.promise().query(createOrder, [getRandomInt(1, customerCount[0].count), getRandomInt(1, routeCount[0].count)]);
        console.log(`Order ${orderResult.insertId} created on ${new Date().toISOString()}`);
        for (let i = 0; i < getRandomInt(1, 10); i++) {
            await connection.promise().query(addingProducts, [orderResult.insertId, getRandomInt(1, productCount[0].count), getRandomInt(1, 5)]);
            console.log(`Product ${i} added to order ${orderResult.insertId}`);
        }
        console.log(`Order ${orderResult.insertId} created on ${new Date().toISOString()}`);

    } catch (error) {
        console.error('Error executing query:', error);
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
