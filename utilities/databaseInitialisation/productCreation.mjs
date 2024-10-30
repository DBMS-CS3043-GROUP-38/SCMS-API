import pool from '../database/db.mjs';


async function productCreation(products) {
    let createdProducts = 0;

    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const { Name, TrainCapacityConsumption, Price, Type } = product;
        const query = `INSERT INTO product (Name, TrainCapacityConsumption, Price, Type) VALUE (?, ?, ?, ?)`;
        const values = [Name, TrainCapacityConsumption, Price, Type];
        try {
            const result = await pool.query(query, values);
            createdProducts++;
        } catch (error) {
            console.log(error);
        }
    }
    return createdProducts;
}

export default productCreation;



    // {
    //     "ProductID": 1,
    //     "Name": "Classic Denim Jeans",
    //     "TrainCapacityConsumption": 3.45,
    //     "Price": 55.20,
    //     "Type": "Clothes"
    // },
    // {
    //     "ProductID": 2,
    //     "Name": "Silk Blouse",
    //     "TrainCapacityConsumption": 2.98,
    //     "Price": 89.99,
    //     "Type": "Clothes"
    // },


