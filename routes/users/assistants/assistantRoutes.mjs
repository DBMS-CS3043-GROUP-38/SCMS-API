// routes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2';
import pool from '../../../utilities/database/db.mjs'

const router = express.Router();
const db = pool;



// Other endpoints
router.get('/assistant/:assistantID/schedules', async (req, res) => {
  const assistantID = parseInt(req.params.assistantID, 10);

  if (isNaN(assistantID)) {
    return res.status(400).json({ error: 'Invalid assistant ID' });
  }

  const query = `
    SELECT TruckScheduleID, RouteID, LicencePlate, StoreCity, ShipmentID, Status, ScheduleDateTime, DriverName 
    FROM truck_schedule_with_details
    WHERE AssistantID = ? AND (Status = 'Not Completed' OR Status = 'In Progress');
  `;

  const [results] = await db.query(query, [assistantID]);
      if (results.length === 0)
        return res.status(404).json({ success: false, message: 'No schedules found' });
      res.json(results);  ;
  });

// Add more routes as required following the same pattern
router.get('/is-in-progress/:truckScheduleID', async (req, res) => {
  const truckScheduleID = req.params.truckScheduleID;

  try {
    // Query to check if the truck schedule is "In Progress"
    const [rows] = await db.query(
      'SELECT Status FROM TruckSchedule WHERE TruckScheduleID = ?',
      [truckScheduleID]
    );

    if (rows.length > 0 && rows[0].Status === "In Progress") {
      return res.json({ isInProgress: true });
    } else {
      return res.json({ isInProgress: false });
    }
  } catch (error) {
    console.error("Error checking truck schedule status:", error);
    res.status(500).json({ error: "Error checking truck schedule status" });
  }
});

router.get('/assistant/:shipment_id/get-orders', async (req, res) => {
  const { shipment_id } = req.params;
  
  try {
    const query = `SELECT s.OrderID, 
       c.Name, 
       c.Address,
       CASE 
           WHEN EXISTS (
               SELECT 1 
               FROM Order_tracking AS ot 
               WHERE ot.OrderID = s.OrderID AND ot.Status = "Delivered"
           ) THEN TRUE
           ELSE FALSE
       END AS IsDelivered
FROM Shipment_contains AS s
INNER JOIN \`Order\` AS o ON s.OrderID = o.OrderID
INNER JOIN Customer AS c ON o.CustomerID = c.CustomerID
WHERE s.ShipmentID = ?`
    const [orders] = await db.query(query,
      [shipment_id]
    );
    
    if (orders.length === 0) {
      res.status(404).json({ message: 'No orders found for this schedule.' });
    } else {
      res.status(200).json(orders); // Send the list of orders back to the client
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to retrieve orders.' });
  }
});

router.post('/mark-delivered', async (req, res) => {
  const { order_id } = req.body;

  if (!order_id) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  const query = 'INSERT INTO Order_tracking (OrderID, TimeStamp, Status) VALUES (?, NOW(), "Delivered")';
  try {
    await db.query(query, [order_id]);
    res.status(201).json({ success: true, message: 'Order tracking added successfully' });
  } catch (error) {
    console.error('Error adding order tracking:', error);
    res.status(500).json({ success: false, error: 'Error adding order tracking' });
  }
});

router.post('/revert-delivered', async (req, res) => {
  const { order_id } = req.body;

  if (!order_id) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  const query = `DELETE FROM Order_tracking
    WHERE OrderID = ?
    AND Status = 'Delivered';`;
  try {
    await db.query(query, [order_id]);
    res.status(201).json({ success: true, message: 'Order tracking added successfully' });
  } catch (error) {
    console.error('Error adding order tracking:', error);
    res.status(500).json({ success: false, error: 'Error adding order tracking' });
  }
});
export default router;
