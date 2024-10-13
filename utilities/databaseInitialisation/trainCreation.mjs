import pool from '../database/db.mjs';

// Function to generate a random day
function getRandomDay() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[Math.floor(Math.random() * days.length)];
}

// Function to generate a random time
function getRandomTime() {
    const hours = Math.floor(Math.random() * 24);
    const minutes = Math.floor(Math.random() * 60);
    const seconds = Math.floor(Math.random() * 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Function to generate a random train capacity
function getRandomCapacity() {
    return (Math.random() * 1000).toFixed(2); // Adjust the multiplier as per your requirement
}

// Function to create a random train record
async function createRandomTrain(storeID) {
    const randomCapacity = getRandomCapacity();
    const randomStoreID = storeID
    const randomTime = getRandomTime();
    const randomDay = getRandomDay();

    try {
        const query = `INSERT INTO Train (FullCapacity, StoreID, Time, Day) VALUES (?, ?, ?, ?)`;
        await pool.query(query, [randomCapacity, randomStoreID, randomTime, randomDay]);
        console.log(`Train with capacity ${randomCapacity} created successfully for Store ${randomStoreID} on ${randomDay} at ${randomTime}`);
    } catch (error) {
        console.log(error);
    }
}

// Function to generate and insert multiple random trains
async function generateRandomTrains(count, numberOfStores) {

    for (let i = 0; i < count; i++) {
        const randomStoreID = Math.floor(Math.random() * numberOfStores) + 1;
        await createRandomTrain(randomStoreID);
    }

}

export default generateRandomTrains;