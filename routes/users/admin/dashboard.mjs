import express from "express";
import pool from '../../../utilities/database/db.mjs'
import { transformTopProducts} from "../../../utilities/transformations.mjs";

const router = express.Router();

router.get('/test', (req, res) => {
    res.send('Admin dashboard route working');
});

router.get('/top-products', async (req, res) => {
    try {
        const query = `
            select * from (select
                               s.Year,
                               s.Quarter,
                               s.ProductID,
                               s.ProductName,
                               s.TotalQuantity,
                               s.TotalRevenue,
                               ROW_NUMBER() over (partition by s.Year, s.Quarter order by s.TotalRevenue desc) as rn
                           from salessummaryviewperquarter s) as Ranked where rn <=5;
        `
        const [rows] = await pool.query(query);
        const transformedData = transformTopProducts(rows);
        res.json(transformedData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch top products' });
    }
});

export default router;