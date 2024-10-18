import passport from "passport";
import { Strategy } from 'passport-local';
import pool from "../../utilities/database/db.mjs";
import bcrypt from 'bcrypt';


// Local Strategy
passport.use(new Strategy(async (username, password, done) => {
    try {
        console.log('Authenticating user');
        const [rows] = await pool.query('SELECT * FROM employee WHERE Username = ?', [username]);
        const user = rows[0];
        if (!user) return done(null, false);

        // Check if the password is valid
        const isValidPassword = await bcrypt.compare(password, user.PasswordHash);
        if (!isValidPassword) return done(null, false);

        return done(null, user);  // Authenticated user
    } catch (error) {
        return done(error);
    }
}));

// Serialize user (store user ID in the session)
passport.serializeUser((user, done) => {
    done(null, { id: user.EmployeeID, type: user.Type, storeId: user.StoreID });
});

// Deserialize user (retrieve user details from the session using the ID)
passport.deserializeUser(async (user, done) => {
    try {
        const [rows] = await pool.query('SELECT * FROM employee WHERE EmployeeID = ?', [user.id]);
        const userData = rows[0];
        done(null, userData);
    } catch (error) {
        done(error, null);
    }
});

export default passport;