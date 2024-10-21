import express from "express";
import dotenv from "dotenv";
import passport from '../dashboard/Stratergy.mjs';
import pool from '../../utilities/database/db.mjs';
import adminRoutes from '../users/admin/admin.mjs';
import managerRoute from '../users/manager/manager.mjs'
import cors from "cors";
import jwt from 'jsonwebtoken';
import bcrypt from "bcrypt";

dotenv.config();
const router = express.Router();
router.use(cors(
    {
        origin: 'http://localhost:3000',
        credentials: true
    }
));

router.use(passport.initialize());


const checkAuth = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user) => {
        if (err) return res.status(500).json({ message: 'Internal server error' });
        if (!user) return res.status(401).json({ message: 'You need to log in.' });

        req.user = user; // Attach the user to the request object
        next(); // Proceed to the next middleware/route handler
    })(req, res, next);
};

const checkAdmin = (req, res, next) => {
    // Ensure that the user is authenticated and present
    if (req.user) {
        // Check if the user type is 'Admin'
        if (req.user.Type === 'Admin') {
            return next();  // User is admin, proceed to the next middleware or route
        }
        return res.status(403).json({ message: 'Access denied. Admins only.' });  // Not authorized
    }
    return res.status(401).json({ message: 'You need to log in.' });  // Not authenticated
};

const checkManager = (req, res, next) => {
    // Ensure that the user is authenticated and present
    if (req.user) {
        // Check if the user type is 'Manager'
        if (req.user.Type === 'StoreManager') {
            return next();  // User is manager, proceed to the next middleware or route
        }
        return res.status(403).json({ message: 'Access denied. Managers only.' });  // Not authorized
    }
    return res.status(401).json({ message: 'You need to log in.' });  // Not authenticated
}

router.use('/admin', checkAuth, checkAdmin, adminRoutes);
router.use('/manager', checkAuth, checkManager, managerRoute);


router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user in database
        const [rows] = await pool.query('SELECT * FROM employee WHERE Username = ?', [username]);
        const user = rows[0];

        // Check if user exists and password is correct
        if (!user || !(await bcrypt.compare(password, user.PasswordHash))) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // User authenticated, create JWT
        const token = jwt.sign(
            { id: user.EmployeeID, type: user.Type, storeId: user.StoreID },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }  // Token expiration time
        );

        // Send token back to the client
        res.status(200).json({
            token,
            type: user.Type,
            name: user.Name,
            branch: user.Type === 'Admin' ? "Central Hub : Kandy" : `Terminal : ${await getCityFromStore(user.StoreID)}`
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// Helper function to get city from store
const getCityFromStore = async (storeId) => {
    const [rows] = await pool.query(`SELECT City FROM store WHERE StoreID = ?`, [storeId]);
    return rows[0]?.City || 'Unknown';  // Default to 'Unknown' if not found
};


export default router;