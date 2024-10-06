import pool from '../database/db.mjs';
import {faker} from "@faker-js/faker";



async function createProduct(data) {
    const {name, trainCapacityConsumption, type, price} = data;
    try {
        const query = `INSERT INTO Product (Name, TrainCapacityConsumption, Price, Type) VALUES (?, ?, ?, ?)`;
        await pool.query(query, [name, trainCapacityConsumption, price, type]);
        console.log(`Product ${name} created successfully: type - ${type}`);
    } catch (error) {
        console.log(error);
    }
}

async function productCreation(categories) {
    let createdProducts = 0;

    for (const category of categories) {
        const numberOfProducts = Math.floor(Math.random() * 100) + 1;
        for (let i = 0; i < numberOfProducts; i++) {
            const name = faker.commerce.productName();
            const trainCapacityConsumption = Math.floor(Math.random() * 100) + 1;
            const price = Math.floor(Math.random() * 10000) + 1;
            await createProduct({name, trainCapacityConsumption, type: category, price});
            createdProducts++;
        }
    }

    await pool.end();
    return createdProducts;
}

export default productCreation;