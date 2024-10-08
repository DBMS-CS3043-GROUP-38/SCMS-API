import pool from '../database/db.mjs';
import dotenv from "dotenv";

dotenv.config();


async function createStore(city) {
    try {
        const query = `INSERT INTO store (City) VALUES (?)`;
        await pool.query(query, [city]);
        console.log(`Store in ${city} created successfully`);
    } catch (error) {
        console.log(error);
    }
}

async function storeCreation(cities) {

    for (const city of cities) {
        await createStore(city);
    }

}

export default storeCreation;