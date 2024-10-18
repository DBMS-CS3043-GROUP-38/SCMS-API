import session from 'express-session';
import express from "express";
import dotenv from "dotenv";
import passport from '../dashboard/Stratergy.mjs';
import pool from '../../utilities/database/db.mjs';
import adminRoutes from '../users/admin/admin.mjs';


dotenv.config();
const router = express.Router();

router.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false
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


router.get('/login', passport.authenticate('local', {
    successRedirect: '/admin',
    failureRedirect: '/login',
    failureFlash: true
}));

export default router;