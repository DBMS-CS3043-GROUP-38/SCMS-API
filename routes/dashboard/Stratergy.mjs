import { Strategy , ExtractJwt } from 'passport-jwt';
import passport from "passport";
import pool from '../../utilities/database/db.mjs';

// Set up JWT options
const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract token from Authorization header
    secretOrKey: process.env.JWT_SECRET, // Your JWT secret
};

// Define the JWT strategy
passport.use(new Strategy(opts, async (jwt_payload, done) => {
    try {
        // Find the user based on the JWT payload
        console.log(jwt_payload);
        const [rows] = await pool.query('SELECT * FROM employee WHERE EmployeeID = ?', [jwt_payload.id]);
        const user = rows[0];
        if (user) {
            return done(null, user);  // User found, proceed
        } else {
            return done(null, false);  // User not found
        }
    } catch (error) {
        return done(error, false);
    }
}));

export default passport;