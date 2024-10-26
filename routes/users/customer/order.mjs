import express from 'express';
import db from '../../../utilities/database/db.mjs'; // Import your db config

const router = express.Router();

// POST route to handle order submission using stored procedure
router.post('/', async (req, res) => {
  const { customerID, orderDate, routeID, products } = req.body;

  let connection; // Initialize connection variable here

  try {
    connection = await db.getConnection(); // Get a connection from the pool
    await connection.beginTransaction(); // Start a transaction

    // Call the stored procedure for inserting the order and products
    const [orderResult] = await connection.query(
      `CALL CreateOrderWithItems(?, ?, ?, NULL, ?, ?, ?)`, // Delivery date is set to NULL
      [
        customerID,
        req.body.value, // Total order value
        orderDate,
        routeID,
        products.length, // Total volume, change if necessary
        JSON.stringify(products) // Pass the products array as a JSON string
      ]
    );

    // Commit the transaction
    await connection.commit();

    res.status(200).json({ message: 'Order and products added successfully!', order: orderResult });
  } catch (error) {
    console.error('Error creating order:', error);
    if (connection) {
      await connection.rollback(); // Rollback on error only if connection exists
    }
    res.status(500).json({ message: 'Error creating order', error: error.message });
  } finally {
    if (connection) {
      connection.release(); // Release the connection
    }
  }
});

export default router;
