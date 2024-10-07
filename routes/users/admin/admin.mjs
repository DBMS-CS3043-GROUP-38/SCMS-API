import express from 'express';
import dashboardRoutes from './dashboard.mjs'

const router = express.Router();

//Routes
router.use('/dashboard', dashboardRoutes);

router.get('/test', (req, res) => {
    res.send('Admin route working');
})

export default router;