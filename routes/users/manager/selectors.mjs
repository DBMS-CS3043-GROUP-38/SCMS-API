import express from "express";
import pool from "../../../utilities/database/db.mjs";

const router = express.Router();

router.get('/test', (req, res) => {
    res.send('Admin dashboard route working');
});


router.get('/today-trains', async (req, res) => {
    try {
        const StoreID = req.user.StoreID;  // Get StoreID from authenticated user

        // Call the stored procedure to fetch today's trains
        const query = 'CALL GetTodayTrainsByStore(?)';
        const [rows] = await pool.query(query, [StoreID]);

        // Check if any rows are returned
        if (rows[0].length === 0) {
            return res.status(404).json({ message: 'No trains scheduled for today' });
        }

        res.json(rows[0]);  // Return the first result set
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch trains today' });
    }
});

export default router;