import connection from '../database/db.js';
import dotenv from "dotenv";

dotenv.config();


async function createStore(city) {
    try {
        const query = `INSERT INTO store (City) VALUES (?)`;
        await connection.promise().query(query, [city]);
        console.log(`Store in ${city} created successfully`);
    } catch (error) {
        console.log(error);
    }
}

async function storeCreation(cities) {
    // Drop all data in store table
    await connection.promise().query('DELETE FROM store');

    for (const city of cities) {
        await createStore(city);
    }
}

export default storeCreation;