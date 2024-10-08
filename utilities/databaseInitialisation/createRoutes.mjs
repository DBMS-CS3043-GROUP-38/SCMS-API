import pool from '../database/db.mjs';
import { faker } from '@faker-js/faker';

// Function to get a random integer within a range
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to generate a random time duration in HH:MM:SS format
function getRandomDuration() {
    const hours = getRandomInt(2, 10);     // Random hours between 0 and 10
    const minutes = getRandomInt(0, 59);   // Random minutes between 0 and 59
    const seconds = getRandomInt(0, 59);   // Random seconds between 0 and 59
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Function to create a random route for each store
async function createRoutesForStores(numStores) {
    let routesCreated = 0;
    try {
        for (let storeID = 1; storeID <= numStores; storeID++) {
            const numRoutes = getRandomInt(3, 10); // Random number of routes per store (between 3 and 10)

            for (let i = 0; i < numRoutes; i++) {
                const timeDuration = getRandomDuration();
                const description = faker.lorem.sentence();

                //Random distance decimal(6,2) between 20 and 100
                const distance = (Math.random() * 80 + 20).toFixed(2);


                await pool.query(
                    `INSERT INTO Route (Time_duration, Description, StoreID, Distance) VALUES (?, ?, ?, ?)`,
                    [timeDuration, description, storeID, distance]
                );

                console.log(`Route created for StoreID ${storeID} with duration ${timeDuration} and description: ${description}`);
                routesCreated++;
            }
        }
    } catch (error) {
        console.error('Error creating routes:', error);
    }
    return routesCreated;
}

export default createRoutesForStores;