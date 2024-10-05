import connection from '../database/db.mjs';

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

function calculatePasteTimeStamp(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString(); // YYYY-MM-DDTHH:MM:SS format
}

// Function to create an order with a fixed order date
async function createOrder(orderDate, productCount, orderStatuses, day, routeCount, customerCount) {
    const customerID = getRandomInt(1, customerCount);
    const routeID = getRandomInt(1, routeCount);
    const deliveryDate = calculatePastDate(day + getRandomInt(12, 20)); // Delivery date between 12 and 20 days after order date
    const status = orderStatuses[Math.random() > 0.5 ? orderStatuses.length - 2 : orderStatuses.length - 1]; // Either 'Delivered' or 'Cancelled'

    try {
        const [orderResult] = await connection.promise().query(
            `INSERT INTO \`Order\` (CustomerID, ProductID, Value, OrderDate, DeliveryDate, RouteID, TotalVolume, ShipmentID, TrainScheduleID)
             VALUES (?, NULL, 0, ?, ?, ?, 0, NULL, NULL)`,
            [customerID, orderDate, deliveryDate, routeID]
        );

        const orderID = orderResult.insertId;

        // Add random products to the order
        for (let i = 0; i < getRandomInt(1, 10); i++) {
            const productID = getRandomInt(1, productCount);
            const amount = getRandomInt(1, 5); // Assuming each product amount is between 1 and 5
            await connection.promise().query(
                `INSERT INTO Contains (OrderID, ProductID, Amount) VALUES (?, ?, ?, ?)`,
                [orderID, productID, amount]
            );
        }

        await createTrackingRecord(orderID, orderStatuses, day);

        console.log(`Order ${orderID} created on ${orderDate} with status ${status}`);
    } catch (error) {
        console.error('Error creating order:', error);
    }
}

async function createTrackingRecord(orderID, orderStatuses, day) {
    for (let i = 0; i < orderStatuses.length; i++) {
        const status = orderStatuses[i];
        const timeStamp = calculatePasteTimeStamp(day + i); // Time stamp for each status
        await connection.promise().query(
            `INSERT INTO Order_Tracking (OrderID, TimeStamp, Status) VALUES (?, ?, ?)`,
            [orderID, timeStamp, status]
        );
    }

    console.log(`Tracking records created for order ${orderID}`);
}

// Function to create orders sequentially for each day in the past two years
async function createOrdersForEachDay(productCount, orderStatuses, routeCount, customerCount) {
    await connection.promise().query('DELETE FROM `Contains`');
    await connection.promise().query('DELETE FROM `Order_Tracking`');
    await connection.promise().query('DELETE FROM `Order`');


    const days = 365 * 2; // Past two years

    for (let day = days; day >= 0; day--) {
        const orderDate = calculatePastDate(day);
        const numOrders = getRandomInt(1, 20); // Random orders per day

        for (let i = 0; i < numOrders; i++) {
            await createOrder(orderDate, productCount, orderStatuses, day, routeCount, customerCount);
        }
    }
}

export default createOrdersForEachDay;