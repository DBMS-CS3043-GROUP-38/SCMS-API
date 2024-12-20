import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../../../utilities/database/db.mjs'
 
const router = express.Router();
const db = pool;

// API endpoint for login
router.post('/login', async (req, res) => {
  try{
    const { username, password } = req.body;
    const query = 'SELECT EmployeeID, Name, PasswordHash, Type, DriverID, AssistantID FROM login_info_view WHERE Username = ?';
    console.log('1');
    const [result] = await pool.query(query, [username]);
    if (result.length == 0)
      return res.status(200).json({ success: false, message: 'User not found' });
    
    console.log('2');
    const employee = result[0];
    const isPasswordMatch = bcrypt.compareSync(password, employee.PasswordHash);
    if (isPasswordMatch) {
      console.log('passmatch');
      const responseData = { 
        success: true, 
        type: employee.Type,
        id: employee.Type === 'Driver' ? employee.DriverID : employee.AssistantID,
        emp_id: employee.EmployeeID,
        name: employee.Name
      };
      return res.status(200).json(responseData);
    } else {
      console.log("nopassmatch");
      return res.status(200).json({ success: false, message: 'Incorrect password' });
    }
  }catch(e){
    console.error(e);
    res.status(500).json({error: "An Error Occurred when trying to Log in!"});
  }
});

// Fetch driver schedules
router.get('/driver/:driverID/schedules', async (req, res) => {
  try{
    const driverID = req.params.driverID;
    const query = `
      SELECT TruckScheduleID, LicencePlate, RouteID, StoreCity, ShipmentID, Status, ScheduleDateTime, AssistantName 
      FROM truck_schedule_with_details
      WHERE DriverID = ? AND (Status = 'Not Completed' OR Status = 'In Progress')
      ORDER BY ScheduleDateTime ASC;
    `; 
    const [results] = await db.query(query, [driverID]);
      if (results.length === 0)
        return res.status(404).json({ success: false, message: 'No schedules found' });
      res.json(results);  
  }catch(e){
    console.error(e);
    res.status(500).json({error: "Failed to get Driver Schedules"});
  }
});    

router.get('/:driverID/hasInProgress', async (req, res) => {
  try{
    const driverID = req.params.driverID;

    const query = `
      SELECT EXISTS(
        SELECT 1 
        FROM TruckSchedule 
        WHERE DriverID = ${driverID} AND Status = 'In Progress'
      ) AS hasInProgress;
    `;

    const [results] = await db.query(query, [driverID]);
    const hasInProgress = results[0].hasInProgress === 1;
    res.status(200).json({ hasInProgress });
  }catch(e){
    console.error(e);
    res.status(500).json({error: "Failed to get If In progress"});
  }
});


// Get specific schedule details
// router.get('/schedule/:scheduleId', async (req, res) => {
//   const scheduleId = req.params.scheduleId;
//   const query = `
//     SELECT t.TruckScheduleID, t.RouteID, t.TruckID, t.StoreID, t.ShipmentID, t.ScheduleDateTime, e.Name 
//     FROM TruckSchedule AS t 
//     INNER JOIN login_info_view AS e ON t.AssistantID = e.AssistantID 
//     WHERE t.TruckScheduleID = ?
//   `;
//   const [results] = await db.query(query, [scheduleId]);
//     if (results.length === 0)
//       return res.status(404).json({ message: 'No schedule found' });

//     const schedule = results[0];
//     const dateTime = new Date(schedule.ScheduleDateTime);
//     res.json({
//       routeId: schedule.RouteID,
//       truckId: schedule.TruckID,
//       assistantName: schedule.Name,
//       departureDate: dateTime.toISOString().split('T')[0],
//       departureTime: dateTime.toTimeString().split(' ')[0],
//       storeId: schedule.StoreID
//     });
// });
 
// Update truck schedule status
router.post('/update-status', async (req, res) => {
  try{
    const { TruckScheduleID, Status } = req.body;
    const connection = await db.getConnection();
    const query = `UPDATE TruckSchedule SET Status = "${Status}" WHERE TruckScheduleID = ${TruckScheduleID}`;

    await connection.beginTransaction();
    await connection.query(query);
    await connection.commit();
    res.status(200).json({ message: 'Status updated successfully' });
  }catch(e){
    console.error(e);
    res.status(500).json({error: "Failed to Update Status"});
  }
});  
  
// Fetch employee details
router.get('/get-employee/:employeeId', async (req, res) => {
  try{
    const employeeId = req.params.employeeId;
    const prequery = `SELECT Type FROM login_info_view 
    WHERE EmployeeID = ?;`;

    
    
    const [preRes] = await db.query(prequery, [employeeId]);
    if (preRes.length === 0)
      return res.status(404).send('Employee not found');
    
    let query;

    if(preRes[0]['Type'] == 'Driver')
      query = `
        SELECT e.Name, e.Address, e.Contact, e.Type, e.Username, d.WorkingHours, d.CompletedHours 
        FROM Employee AS e 
        INNER JOIN Driver AS d ON e.EmployeeID = d.EmployeeID 
        WHERE e.EmployeeID = ${employeeId};
      `;
    else
      query = `
          SELECT e.Name, e.Address, e.Contact, e.Type, e.Username, d.WorkingHours, d.CompletedHours 
          FROM Employee AS e 
          INNER JOIN Assistant AS d ON e.EmployeeID = d.EmployeeID 
          WHERE e.EmployeeID = ${employeeId};
        `;
    const [results] = await db.query(query, [employeeId]);
    
    res.status(200).json(results[0]);
  }catch (e){
    console.error(e);
    res.status(500).json({error: "Failed to get Employee Details"});
  }
});

export default router;