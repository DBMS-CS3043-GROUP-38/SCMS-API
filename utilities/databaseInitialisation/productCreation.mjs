import pool from '../database/db.mjs';


// Function to generate random float capacities between 5 and 10
function randomCapacity() {
    return (Math.random() * 5) + 5;
}


async function productCreation(products) {
    let createdProducts = 0;

    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const { Name, TrainCapacityConsumption, Price, Type } = product;
        const query = `INSERT INTO product (Name, TrainCapacityConsumption, Price, Type) VALUE (?, ?, ?, ?)`;
        const values = [Name, randomCapacity(), Price, Type];
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


