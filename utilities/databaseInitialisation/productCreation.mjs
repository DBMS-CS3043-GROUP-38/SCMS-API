import connection from '../database/db.js';
import {faker} from "@faker-js/faker";



async function createProduct(data) {
    const {name, trainCapacityConsumption, type, price} = data;
    try {
        const query = `INSERT INTO Product (Name, TrainCapacityConsumption, Price, Type) VALUES (?, ?, ?, ?)`;
        await connection.promise().query(query, [name, trainCapacityConsumption, price, type]);
        console.log(`Product ${name} created successfully: type - ${type}`);
    } catch (error) {
        console.log(error);
    }
}

async function productCreation(categories) {
    // Drop all data in Product table
    await connection.promise().query('DELETE FROM Product');
    let createdProducts = 0;

    for (const category of categories) {
        const numberOfProducts = Math.floor(Math.random() * 500) + 1;
        for (let i = 0; i < numberOfProducts; i++) {
            const name = faker.commerce.productName();
            const trainCapacityConsumption = Math.floor(Math.random() * 100) + 1;
            const price = Math.floor(Math.random() * 10000) + 1;
            await createProduct({name, trainCapacityConsumption, type: category, price});
            createdProducts++;
        }
    }
    return createdProducts;
}

export default productCreation;