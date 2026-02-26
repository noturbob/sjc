const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const db = require('../db/connection');

// Configure email transporter
const transporter = nodemailer.createTransport({
    service: 'sendgrid',
    auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
    }
});

// Generate JWT tokens
function generateTokens(user) {
    const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
    
    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );
    
    return { accessToken, refreshToken };
}

// Student/Faculty Login
router.post('/login', [
    body('rollNo').optional().trim(),
    body('email').optional().isEmail(),
    body('password').notEmpty(),
    body('role').isIn(['student', 'faculty'])
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { rollNo, email, password, role } = req.body;
    
    try {
        let userEmail;
        
        if (role === 'student') {
            if (!rollNo) {
                return res.status(400).json({ error: 'Roll number is required for students' });
            }
            userEmail = `${rollNo}@josephscollege.ac.in`;
        } else {
            userEmail = email;
        }
        
        // Find user
        const user = await db.query(
            'SELECT * FROM users WHERE email = $1 AND role = $2',
            [userEmail, role]
        );
        
        if (user.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const foundUser = user.rows[0];
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, foundUser.password_hash);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Generate tokens
        const tokens = generateTokens(foundUser);
        
        res.json({
            message: 'Login successful',
            user: {
                id: foundUser.id,
                email: foundUser.email,
                role: foundUser.role
            },
            ...tokens
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Google OAuth Login
router.get('/google', 
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        hd: 'josephscollege.ac.in' // Hosted domain restriction
    })
);

// Google OAuth Callback
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        const tokens = generateTokens(req.user);
        
        // Redirect to frontend with tokens
        res.redirect(
            `${process.env.FRONTEND_URL}/auth/callback?` + 
            `token=${tokens.accessToken}&refresh=${tokens.refreshToken}`
        );
    }
);

// Request OTP for Password Reset
router.post('/password/request-otp', [
    body('rollNo').optional().trim(),
    body('email').optional().isEmail()
], async (req, res) => {
    const { rollNo, email } = req.body;
    
    try {
        let userEmail;
        
        if (rollNo) {
            userEmail = `${rollNo}@josephscollege.ac.in`;
        } else if (email) {
            userEmail = email;
        } else {
            return res.status(400).json({ error: 'Roll number or email required' });
        }
        
        // Check if user exists
        const user = await db.query(
            'SELECT id FROM users WHERE email = $1',
            [userEmail]
        );
        
        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        
        // Store OTP in database
        await db.query(
            'INSERT INTO otp_tokens (email, otp_code, expires_at, purpose) VALUES ($1, $2, $3, $4)',
            [userEmail, otp, expiresAt, 'password_reset']
        );
        
        // Send OTP via email
        await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: userEmail,
            subject: 'Password Reset OTP - St. Joseph\'s College',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Password Reset Request</h2>
                    <p>Your OTP for password reset is:</p>
                    <h1 style="color: #2563eb; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
                    <p>This OTP will expire in 10 minutes.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">
                        St. Joseph's College (Autonomous)<br>
                        Student Information System
                    </p>
                </div>
            `
        });
        
        res.json({ 
            message: 'OTP sent successfully to your college email',
            email: userEmail.replace(/(.{3}).*(@.*)/, '$1***$2') // Partially hide email
        });
        
    } catch (error) {
        console.error('OTP request error:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// Verify OTP
router.post('/password/verify-otp', [
    body('email').isEmail(),
    body('otp').isLength({ min: 6, max: 6 })
], async (req, res) => {
    const { email, otp } = req.body;
    
    try {
        const result = await db.query(
            `SELECT * FROM otp_tokens 
             WHERE email = $1 AND otp_code = $2 AND purpose = 'password_reset' 
             AND expires_at > NOW() AND is_used = false
             ORDER BY created_at DESC LIMIT 1`,
            [email, otp]
        );
        
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }
        
        // Generate a temporary token for password reset
        const resetToken = jwt.sign(
            { email, otp_id: result.rows[0].id },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );
        
        res.json({ 
            message: 'OTP verified successfully',
            resetToken 
        });
        
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ error: 'Failed to verify OTP' });
    }
});

// Reset Password
router.post('/password/reset', [
    body('resetToken').notEmpty(),
    body('newPassword').isLength({ min: 8 })
], async (req, res) => {
    const { resetToken, newPassword } = req.body;
    
    try {
        // Verify reset token
        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        
        // Mark OTP as used
        await db.query(
            'UPDATE otp_tokens SET is_used = true WHERE id = $1',
            [decoded.otp_id]
        );
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        
        // Update user password
        await db.query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2',
            [hashedPassword, decoded.email]
        );
        
        res.json({ message: 'Password reset successfully' });
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    // In a production system, you might want to blacklist the token
    res.json({ message: 'Logged out successfully' });
});

// Verify Token (for protected routes)
router.get('/verify-token', authenticateToken, (req, res) => {
    res.json({ 
        valid: true,
        user: req.user
    });
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

module.exports = router;