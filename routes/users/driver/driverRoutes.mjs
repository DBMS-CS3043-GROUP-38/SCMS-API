import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../../../utilities/database/db.mjs'

const router = express.Router();

// API endpoint for login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT EmployeeID, Name, PasswordHash, Type, DriverID, AssistantID FROM login_info_view WHERE Username = ?';
  db.query(query, [username], (err, result) => {
    if (err) return res.status(500).send('Server error');
    if (result.length > 0) {
      const employee = result[0];
      const isPasswordMatch = bcrypt.compareSync(password, employee.PasswordHash);
      if (isPasswordMatch) {
        const responseData = {
          success: true,
          type: employee.Type,
          id: employee.Type === 'Driver' ? employee.DriverID : employee.AssistantID,
          emp_id: employee.EmployeeID,
          name: employee.Name
        };
        return res.status(200).json(responseData);
      } else {
        return res.status(200).json({ success: false, message: 'Incorrect password' });
      }
    } else {
      return res.status(200).json({ success: false, message: 'User not found' });
    }
  });
});

// Fetch driver schedules
router.get('/driver/:driverID/schedules', (req, res) => {
  const driverID = req.params.driverID;
  const query = `
    SELECT t.TruckScheduleID, t.RouteID, t.TruckID, t.StoreID, t.ShipmentID, t.Status, t.ScheduleDateTime, e.Name 
    FROM TruckSchedule AS t 
    INNER JOIN login_info_view AS e ON t.AssistantID = e.AssistantID 
    WHERE t.DriverID = ? AND (t.Status = 'Not Completed' OR t.Status = 'In Progress');
  `;
  db.query(query, [driverID], (error, results) => {
    if (error) return res.status(500).send(error);
    if (results.length === 0) return res.status(404).json({ success: false, message: 'No schedules found' });
    res.json(results);
  });
});

// Get specific schedule details
router.get('/schedule/:scheduleId', (req, res) => {
  const scheduleId = req.params.scheduleId;
  const query = `
    SELECT t.TruckScheduleID, t.RouteID, t.TruckID, t.StoreID, t.ShipmentID, t.ScheduleDateTime, e.Name 
    FROM TruckSchedule AS t 
    INNER JOIN login_info_view AS e ON t.AssistantID = e.AssistantID 
    WHERE t.TruckScheduleID = ?
  `;
  db.query(query, [scheduleId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'No schedule found' });

    const schedule = results[0];
    const dateTime = new Date(schedule.ScheduleDateTime);
    res.json({
      routeId: schedule.RouteID,
      truckId: schedule.TruckID,
      assistantName: schedule.Name,
      departureDate: dateTime.toISOString().split('T')[0],
      departureTime: dateTime.toTimeString().split(' ')[0],
      storeId: schedule.StoreID
    });
  });
});

// Update truck schedule status
router.post('/update-status', (req, res) => {
  const { TruckScheduleID, Status } = req.body;
  const query = 'UPDATE TruckSchedule SET Status = ? WHERE TruckScheduleID = ?';
  db.query(query, [Status, TruckScheduleID], (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(200).json({ message: 'Status updated successfully' });
  });
});

// Fetch employee details
router.get('/get-employee/:employeeId', (req, res) => {
  const employeeId = req.params.employeeId;
  const query = `
    SELECT e.Name, e.Address, e.Contact, e.Type, e.Username, d.WorkingHours, d.CompletedHours 
    FROM Employee AS e 
    INNER JOIN Driver AS d ON e.EmployeeID = d.EmployeeID 
    WHERE e.EmployeeID = ?
  `;
  db.query(query, [employeeId], (err, result) => {
    if (err) return res.status(500).send('Server error');
    if (result.length === 0) return res.status(404).send('Employee not found');
    res.status(200).json(result[0]);
  });
});

export default router;