const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('../db/connection');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback',
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
},
async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        
        // Verify college domain
        if (!email.endsWith('@josephscollege.ac.in')) {
            return done(null, false, { 
                message: 'Only @josephscollege.ac.in emails are allowed' 
            });
        }
        
        // Determine role based on email pattern
        let role = 'faculty'; // Default to faculty
        if (/^\d+@josephscollege\.ac\.in$/.test(email)) {
            role = 'student'; // If email is all digits, it's a student
        }
        
        // Check if user exists
        let user = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        if (user.rows.length === 0) {
            // Create new user
            const result = await db.query(
                `INSERT INTO users (email, role, oauth_provider, oauth_id, is_active) 
                 VALUES ($1, $2, $3, $4, true) 
                 RETURNING *`,
                [email, role, 'google', profile.id]
            );
            user = result;
            
            // If student, create student record
            if (role === 'student') {
                const rollNo = email.split('@')[0];
                await db.query(
                    `INSERT INTO students (user_id, roll_no, student_name, status) 
                     VALUES ($1, $2, $3, $4)`,
                    [user.rows[0].id, rollNo, profile.displayName, 'Active']
                );
            } else {
                // If faculty, create faculty record
                await db.query(
                    `INSERT INTO faculty (user_id, faculty_name) 
                     VALUES ($1, $2)`,
                    [user.rows[0].id, profile.displayName]
                );
            }
        } else {
            // Update OAuth info if changed
            await db.query(
                'UPDATE users SET oauth_provider = $1, oauth_id = $2 WHERE id = $3',
                ['google', profile.id, user.rows[0].id]
            );
        }
        
        return done(null, user.rows[0]);
        
    } catch (error) {
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        done(null, result.rows[0]);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;