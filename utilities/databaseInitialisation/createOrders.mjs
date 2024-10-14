import pool from '../database/db.mjs';

// Function to get a random integer within a range
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to calculate a past date based on the number of days ago
function calculatePastDate(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

function calculatePastTimeStamp(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}


// Function to create an order with a fixed order date
async function createOrder(orderDate, productCount, orderStatuses, day, routeCount, customerCount) {
    const customerID = getRandomInt(1, customerCount);
    const routeID = getRandomInt(1, routeCount);
    const delDate = day - getRandomInt(12, 20)
    const deliveryDate = calculatePastDate(delDate); // Delivery date between 12 and 20 days after order date
    const status = orderStatuses[Math.random() > 0.1 ? orderStatuses.length - 2 : orderStatuses.length - 1]; // Either 'Delivered' or 'Cancelled'

    try {
        const [orderResult] = await pool.query(
            `INSERT INTO \`Order\` (CustomerID, Value, OrderDate, DeliveryDate, RouteID, TotalVolume)
             VALUE (?, 0, ?, ?, ?, 0)`,
            [customerID, orderDate, deliveryDate, routeID]
        );

        const orderID = orderResult.insertId;

        // Add random products to the order
        for (let i = 0; i < getRandomInt(1, 10); i++) {
            const productID = getRandomInt(1, productCount);
            const amount = getRandomInt(1, 5); // Assuming each product amount is between 1 and 5
            await pool.query(
                `INSERT INTO Contains (OrderID, ProductID, Amount) VALUES (?, ?, ?)`,
                [orderID, productID, amount]
            );
        }

        await createTrackingRecord(orderID, orderStatuses, day);

        // Create final tracking record
        const finalTime = calculatePastTimeStamp(delDate);
        await pool.query(
            `INSERT INTO Order_Tracking (OrderID, TimeStamp, Status) VALUES (?, ?, ?)`,
            [orderID, finalTime, status]
        );


        console.log(`Order ${orderID} created on ${orderDate} with status ${status}`);
    } catch (error) {
        console.error('Error creating order:', error);
    }
}

async function createTrackingRecord(orderID, orderStatuses, day) {
    for (let i = 0; i < orderStatuses.length - 3; i++) {
        const status = orderStatuses[i];
        const timeStamp = calculatePastTimeStamp(day - i); // Time stamp for each status
        await pool.query(
            `INSERT INTO Order_Tracking (OrderID, TimeStamp, Status) VALUES (?, ?, ?)`,
            [orderID, timeStamp, status]
        );
    }

    console.log(`Tracking records created for order ${orderID}`);
}

// Function to create orders sequentially for each day in the past two years
async function createOrdersForEachDay(productCount, orderStatuses, routeCount, customerCount) {
    const days = 365 * 2; // Past two years

    for (let day = days; day >= 20; day--) {
        const orderDate = calculatePastDate(day);
        const numOrders = getRandomInt(1, 5); // Random orders per day

        for (let i = 0; i < numOrders; i++) {
            await createOrder(orderDate, productCount, orderStatuses, day, routeCount, customerCount);
        }
    }
}

export default createOrdersForEachDay;