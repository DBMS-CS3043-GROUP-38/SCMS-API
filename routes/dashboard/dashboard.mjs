import session from 'express-session';
import express from "express";
import dotenv from "dotenv";
import passport from '../dashboard/Stratergy.mjs';
import pool from '../../utilities/database/db.mjs';
import adminRoutes from '../users/admin/admin.mjs';
import cors from "cors";

dotenv.config();
const router = express.Router();
router.use(cors(
    {
        origin: 'http://localhost:3000',
        credentials: true
    }
));

router.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        httpOnly: true,
    }
}));
router.use(passport.initialize());
router.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user.EmployeeID);
});

passport.deserializeUser(async (id, done) => {
    try {
        const [rows] = await pool.query(`SELECT *
                                         FROM employee
                                         WHERE EmployeeID = ?`, [id]);
        const user = rows[0];

        done(null, user);  // Attach the full user object to req.user
    } catch (error) {
        done(error, null);
    }
});

const checkAuth = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).send('You need to log in.');
};

const checkAdmin = (req, res, next) => {
    if (req.user?.Type === 'Admin') {
        return next();
    }
    res.status(403).send('Access denied.');
};

router.use('/admin', checkAuth, checkAdmin, adminRoutes);


router.post('/login', async (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).json({ message: 'Internal server error' });
        }
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        req.logIn(user, (err) => {
            if (err) {
                return res.status(500).json({ message: 'Internal server error' });
            }
            // Successful login, send a success response
            if (user.Type === 'Admin') {
                return res.status(200).json({
                    type: user.Type,
                    name: user.Name,
                    branch: "Central Hub : Kandy"
                });
            } else {
                const rows = pool.query(`select City from store where StoreID = ?`, [user.StoreID]);
                return res.status(200).json({
                    type: user.Type,
                    name: user.Name,
                    branch: `Terminal : ${rows[0].City}`
                });
            }
        });
    })(req, res, next);
});

export default router;