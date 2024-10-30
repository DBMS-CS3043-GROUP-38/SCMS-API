// routes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2';
import pool from '../../../utilities/database/db.mjs'

const router = express.Router();
const db = pool;



// Other endpoints
router.get('/assistant/:assistantID/schedules', (req, res) => {
  const assistantID = parseInt(req.params.assistantID, 10);

  if (isNaN(assistantID)) {
    return res.status(400).json({ error: 'Invalid assistant ID' });
  }

  const query = `
    SELECT TruckScheduleID, RouteID, truckID, LicencePlate, StoreID, StoreCity, ShipmentID, Status, ScheduleDateTime, DriverName 
    FROM truck_schedule_with_details
    WHERE AssistantID = ? AND (Status = 'Not Completed' OR Status = 'In Progress');
  `;

  db.query(query, [assistantID], (error, results) => {
    if (error) return res.status(500).json({ success: false, message: "Internal Server Error" });
    
    const response = results.length
      ? { success: true, data: results }
      : { success: true, message: "No schedules assigned", data: [] };
      
    res.json(response);
  });
});

// Add more routes as required following the same pattern

export default router;
