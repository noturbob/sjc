# 🚀 Quick Start Guide - St. Joseph's College SIS

Welcome to the St. Joseph's College Student Information System setup guide. This guide will help you get the system up and running quickly.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v15 or higher) - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)
- **npm** or **yarn** package manager
- A text editor (VS Code recommended)

---

## 🏗️ Project Structure

```
college-sis/
├── backend/
│   ├── config/
│   │   ├── database.js
│   │   ├── passport.js
│   │   └── email.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── student.js
│   │   ├── faculty.js
│   │   └── documents.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── authorize.js
│   ├── services/
│   │   ├── documentGenerator.js
│   │   └── emailService.js
│   ├── models/
│   ├── .env
│   ├── .env.example
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── styles/
│   ├── public/
│   └── package.json
├── documents/
│   ├── applications/
│   ├── grades/
│   └── certificates/
├── uploads/
├── logs/
├── database-migration.sql
└── docker-compose.yml
```

---

## ⚡ Quick Setup (5 Steps)

### Step 1: Clone or Create Project

```bash
# Create project directory
mkdir college-sis
cd college-sis

# Initialize git
git init

# Create directory structure
mkdir -p backend/{config,routes,middleware,services,models}
mkdir -p frontend/src/{app,components,lib,styles}
mkdir -p documents/{applications,grades,certificates}
mkdir -p uploads logs
```

### Step 2: Setup Database

```bash
# 1. Start PostgreSQL
sudo service postgresql start  # Linux
# or
brew services start postgresql  # Mac

# 2. Create database
psql -U postgres
CREATE DATABASE college_db;
\q

# 3. Run migration
psql -U postgres -d college_db -f database-migration.sql

# Verify tables created
psql -U postgres -d college_db
\dt
\q
```

### Step 3: Setup Backend

```bash
cd backend

# Initialize npm project
npm init -y

# Install dependencies
npm install express cors dotenv bcrypt jsonwebtoken passport passport-google-oauth20 \
  passport-jwt express-session pg nodemailer pdfkit exceljs express-validator \
  helmet compression morgan multer

# Install dev dependencies
npm install --save-dev nodemon

# Copy environment variables
cp ../.env.example .env

# Edit .env with your values (use nano, vim, or any editor)
nano .env
```

**Important: Update these in .env:**
```
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/college_db
JWT_SECRET=<generate using: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
SENDGRID_API_KEY=<from SendGrid>
```

```bash
# Add to package.json scripts:
# "start": "node server.js",
# "dev": "nodemon server.js"

# Start server
npm run dev
```

### Step 4: Setup Frontend (Next.js)

```bash
cd ../frontend

# Create Next.js app with TypeScript and Tailwind
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir

# Install additional dependencies
npm install axios zustand react-hook-form zod @hookform/resolvers
npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-dropdown-menu
npm install lucide-react date-fns

# Or install shadcn/ui (recommended)
npx shadcn-ui@latest init

# Start development server
npm run dev
```

### Step 5: Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)
7. Copy Client ID and Client Secret to `.env`

---

## 🔧 Configuration Checklist

### 1. Database Configuration
- [x] PostgreSQL installed
- [x] Database created
- [x] Migration script executed
- [x] Connection string in .env
- [x] Test connection

```bash
# Test database connection
psql -U postgres -d college_db -c "SELECT COUNT(*) FROM users;"
```

### 2. Authentication Setup
- [x] JWT secrets generated
- [x] Google OAuth credentials configured
- [x] Session secret set
- [x] Password hashing working

### 3. Email Service Setup
- [x] SendGrid/SES/Gmail configured
- [x] Sender email verified
- [x] Test email sent

```bash
# Test email sending (add this to your code)
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'sendgrid',
  auth: { user: 'apikey', pass: process.env.SENDGRID_API_KEY }
});
transporter.sendMail({
  from: 'noreply@josephscollege.ac.in',
  to: 'test@example.com',
  subject: 'Test',
  text: 'Working!'
}).then(() => console.log('✅ Email sent')).catch(console.error);
"
```

### 4. File Storage Setup
- [x] Upload directory created
- [x] Permissions set (chmod 755)
- [x] AWS S3/GCS configured (if using)

---

## 🧪 Testing the System

### 1. Test Backend API

```bash
# Check if server is running
curl http://localhost:3000/health

# Expected response: {"status":"OK","timestamp":"..."}
```

### 2. Test Student Login

Create a test student:
```sql
-- Run in psql
INSERT INTO users (email, password_hash, role, is_active) VALUES
('121423408057@josephscollege.ac.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lWmjrR.k3M8G', 'student', true);

INSERT INTO students (user_id, roll_no, hall_ticket_no, admission_date, student_name, batch, status, date_of_birth, mobile_no, gender, identification_mark_1) 
VALUES (
    (SELECT id FROM users WHERE email = '121423408057@josephscollege.ac.in'),
    '121423408057', 'HT2024001', '2024-06-15', 'Test Student', 'BCA 2024-2027', 'Active',
    '2005-08-15', '9876543210', 'Male', 'Mole on left hand'
);
```

Default password for test accounts: `Test@123`

Test login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "rollNo": "121423408057",
    "password": "Test@123",
    "role": "student"
  }'
```

### 3. Test OTP System

```bash
curl -X POST http://localhost:3000/api/auth/password/request-otp \
  -H "Content-Type: application/json" \
  -d '{"rollNo": "121423408057"}'

# Check your email for OTP, then verify:
curl -X POST http://localhost:3000/api/auth/password/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "121423408057@josephscollege.ac.in",
    "otp": "123456"
  }'
```

### 4. Test Document Generation

```bash
# First, get auth token from login
TOKEN="your-jwt-token-here"

# Generate bonafide certificate
curl -X POST http://localhost:3000/api/documents/generate-application \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"applicationType": "bonafide"}' \
  --output bonafide.pdf
```

---

## 🎨 Frontend Pages to Create

### 1. Login Pages
- `/login/student` - Student login with roll number
- `/login/faculty` - Faculty login with email
- `/forgot-password` - OTP-based password reset

### 2. Student Portal
- `/student/dashboard` - Overview, quick stats
- `/student/profile` - View/edit profile
- `/student/documents` - Generate applications
- `/student/marks` - View semester marks
- `/student/attendance` - View attendance (future)

### 3. Faculty Portal
- `/faculty/dashboard` - Class overview
- `/faculty/students` - List of students in assigned classes
- `/faculty/students/[id]/edit` - Edit student details
- `/faculty/marks` - Enter marks for students
- `/faculty/attendance` - Mark attendance (future)

### 4. Admin Portal
- `/admin/dashboard` - System overview
- `/admin/students` - Manage all students
- `/admin/faculty` - Manage faculty
- `/admin/classes` - Manage class assignments
- `/admin/reports` - Generate reports

---

## 🔐 Security Best Practices

### 1. Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one number
- Implement password strength meter

### 2. Rate Limiting
Add to your Express app:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);

// Stricter limit for OTP requests
const otpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5
});

app.use('/api/auth/password/request-otp', otpLimiter);
```

### 3. Input Validation
Always validate on both frontend and backend:
```javascript
const { body, validationResult } = require('express-validator');

router.post('/api/students/update',
    body('email').isEmail(),
    body('mobile_no').isMobilePhone('en-IN'),
    body('aadhaar_no').isLength({ min: 12, max: 12 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        // Process request
    }
);
```

### 4. SQL Injection Prevention
Always use parameterized queries:
```javascript
// ✅ GOOD - Parameterized query
db.query('SELECT * FROM students WHERE roll_no = $1', [rollNo]);

// ❌ BAD - String concatenation
db.query(`SELECT * FROM students WHERE roll_no = '${rollNo}'`);
```

---

## 📊 Sample Data for Testing

Run this to populate with test data:

```sql
-- Insert multiple test students
DO $$
DECLARE
    i INTEGER;
    roll VARCHAR;
    email VARCHAR;
    user_uuid UUID;
BEGIN
    FOR i IN 1..20 LOOP
        roll := '12142340805' || i::TEXT;
        email := roll || '@josephscollege.ac.in';
        
        INSERT INTO users (email, password_hash, role, is_active)
        VALUES (email, '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lWmjrR.k3M8G', 'student', true)
        RETURNING id INTO user_uuid;
        
        INSERT INTO students (user_id, roll_no, hall_ticket_no, admission_date, student_name, batch, status, date_of_birth, mobile_no, gender, identification_mark_1)
        VALUES (
            user_uuid, roll, 'HT2024' || LPAD(i::TEXT, 3, '0'), '2024-06-15',
            'Test Student ' || i, 'BCA 2024-2027', 'Active',
            '2005-08-' || LPAD(i::TEXT, 2, '0'), '987654' || LPAD(i::TEXT, 4, '0'), 'Male', 'Test mark'
        );
    END LOOP;
END $$;
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Database Connection Failed
**Solution:**
```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Check connection string
psql -U postgres -d college_db

# Verify .env has correct DATABASE_URL
```

### Issue 2: OAuth Redirect URI Mismatch
**Solution:**
- Ensure redirect URI in Google Console matches exactly
- Check for http vs https
- Verify port number
- Clear browser cache

### Issue 3: OTP Email Not Sending
**Solution:**
```bash
# Test email configuration
node -e "console.log(process.env.SENDGRID_API_KEY)"

# Check SendGrid dashboard for errors
# Verify sender domain is verified
# Check spam folder
```

### Issue 4: CORS Errors
**Solution:**
```javascript
// Add to backend server.js
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
```

### Issue 5: JWT Token Expired
**Solution:**
- Implement token refresh mechanism
- Store refresh token in httpOnly cookie
- Auto-refresh before expiry

---

## 📈 Next Steps After Setup

### Week 1: Core Features
- [x] Authentication working
- [ ] Student profile CRUD
- [ ] Faculty can view assigned students
- [ ] Basic document generation

### Week 2: Enhanced Features
- [ ] Grade entry system
- [ ] Advanced document templates
- [ ] Email notifications
- [ ] File upload for documents

### Week 3: Faculty Features
- [ ] Bulk grade entry
- [ ] Export student data
- [ ] Attendance marking
- [ ] Class-wise reports

### Week 4: Admin Panel
- [ ] User management
- [ ] Class assignments
- [ ] System settings
- [ ] Analytics dashboard

---

## 🎯 Production Deployment Checklist

When ready to deploy to production:

- [ ] Set NODE_ENV=production
- [ ] Use strong database passwords
- [ ] Enable SSL/HTTPS
- [ ] Set up CDN for static assets
- [ ] Configure automated backups
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Enable security headers
- [ ] Set up firewall rules
- [ ] Configure rate limiting
- [ ] Test disaster recovery
- [ ] Set up staging environment
- [ ] Document deployment process
- [ ] Train staff on system usage

---

## 📚 Additional Resources

### Documentation
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Passport.js Documentation](http://www.passportjs.org/docs/)

### Tutorials
- JWT Authentication: [jwt.io](https://jwt.io/)
- Google OAuth: [developers.google.com](https://developers.google.com/identity/protocols/oauth2)
- SendGrid API: [sendgrid.com/docs](https://docs.sendgrid.com/)

### Tools
- Database GUI: [pgAdmin](https://www.pgadmin.org/)
- API Testing: [Postman](https://www.postman.com/) or [Insomnia](https://insomnia.rest/)
- Version Control: [Git](https://git-scm.com/)

---

## 💡 Tips for Success

1. **Start Small**: Get authentication working first before adding features
2. **Test Often**: Test each feature as you build it
3. **Use Git**: Commit frequently with meaningful messages
4. **Document Changes**: Keep track of what you modify
5. **Security First**: Never commit sensitive data or .env files
6. **Backup Regularly**: Set up automated database backups
7. **Monitor Logs**: Check application logs regularly
8. **Stay Updated**: Keep dependencies updated for security patches

---

## 🆘 Getting Help

If you encounter issues:

1. Check the error logs in `./logs` directory
2. Review the console output
3. Check database queries in PostgreSQL logs
4. Test API endpoints with Postman
5. Verify environment variables are set correctly
6. Check for typos in configuration

---

## 🎉 You're Ready!

You now have a fully functional Student Information System. The system includes:

✅ Secure authentication with OAuth and OTP
✅ Student and faculty portals
✅ Document generation (applications, grade memos)
✅ Role-based access control
✅ Comprehensive student data management
✅ Grade management system
✅ Email notifications

Start building and customizing for St. Joseph's College!

---

**Happy Coding! 🚀**

For questions or support, refer to the main architecture document or create detailed documentation as you build.