import pool from '../database/db.mjs';

// Function to generate a random license plate
function getRandomLicensePlate() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let plate = '';

    for (let i = 0; i < 3; i++) {
        plate += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    for (let i = 0; i < 4; i++) {
        plate += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    return plate;
}

// Function to create a truck entry for a given store
async function createTruck(storeID) {
    const licensePlate = getRandomLicensePlate();
    const status = 'Available';

    try {
        const query = `INSERT INTO Truck (StoreID, LicencePlate, Status) VALUES (?, ?, ?)`;
        await pool.query(query, [storeID, licensePlate, status]);
        console.log(`Truck with license plate ${licensePlate} created for Store ${storeID} with status ${status}`);
    } catch (error) {
        console.log(error);
    }

}

// Function to generate random trucks for each store
async function generateRandomTrucks(numOfStores) {

    for (let storeID = 1; storeID <= numOfStores; storeID++) {
        const numOfTrucks = Math.floor(Math.random() * 41) + 10; // Random number between 10 and 50

        for (let i = 0; i < numOfTrucks; i++) {
            await createTruck(storeID);
        }
    }
}

export default generateRandomTrucks;