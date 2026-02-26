const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const facultyRoutes = require('./routes/faculty');
const documentRoutes = require('./routes/documents');

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/documents', documentRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});