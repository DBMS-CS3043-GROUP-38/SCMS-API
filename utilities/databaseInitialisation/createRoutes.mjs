import pool from '../database/db.mjs';
import { faker } from '@faker-js/faker';

// Function to get a random integer within a range
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to generate a random time duration in HH:MM:SS format
function getRandomDuration() {
    const hours = getRandomInt(2, 5);     // Random hours between 0 and 10
    const minutes = getRandomInt(0, 59);   // Random minutes between 0 and 59
    const seconds = getRandomInt(0, 59);   // Random seconds between 0 and 59
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Function to create a random route for each store
async function createRoutesForStores(routes) {
    let routesCreated = 0;

    for (const route of routes) {
        const timeDuration = getRandomDuration()
        const description = route.Description;
        const storeID = route.StoreID;
        const distance = route.Distance;

        const query = 'INSERT INTO Route ( Time_duration, Description, StoreID, Distance) VALUES ( ?, ?, ?, ?)';
        const values = [ timeDuration, description, storeID, distance];

        try {
            await pool.query(query, values);
            routesCreated++;
        } catch (error) {
            console.error(error);
        }
    }

    return routesCreated;
}

export default createRoutesForStores;


// [
//     {
//         "RouteID": 1,
//         "Time_duration": "06:57:07",
//         "Description": "Kurunegala to Anamaduwa via A10 ",
//         "StoreID": 1,
//         "Distance": 68.96
//     },
//     {
//         "RouteID": 2,
//         "Time_duration": "08:36:49",
//         "Description": "Kurunegala to Polgahawela via A3",
//         "StoreID": 1,
//         "Distance": 55.92
//     },