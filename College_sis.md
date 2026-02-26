# St. Joseph's College - Student Information System
## Technical Architecture & Implementation Guide

---

## 1. SYSTEM OVERVIEW

### Purpose
A comprehensive web-based Student Information System (SIS) for St. Joseph's College that handles:
- Student & Faculty Authentication (OAuth + OTP)
- Student Data Management
- Document Generation (Applications, Grade Memos)
- Faculty-controlled Student Updates

### Key Features
- Roll number-based login for students
- Email-based login for faculty
- OAuth integration with college email (@josephscollege.ac.in)
- OTP-based password management
- Automated document generation
- Role-based access control

---

## 2. AUTHENTICATION SYSTEM

### A. Student Authentication

#### Login Methods:
1. **Roll Number + Password**
   - Roll No: `121423408057`
   - Auto-maps to: `121423408057@josephscollege.ac.in`
   
2. **OAuth (Google Workspace)**
   - Only allows @josephscollege.ac.in domain
   - Auto-login for verified college accounts

#### Password Reset Flow:
```
User enters Roll No → System sends OTP to {rollno}@josephscollege.ac.in 
→ User enters OTP → User sets new password
```

### B. Faculty Authentication

#### Login Methods:
1. **Full Email + Password**
   - Example: `john.doe@josephscollege.ac.in`
   
2. **OAuth (Google Workspace)**
   - Domain-restricted to @josephscollege.ac.in

---

## 3. DATABASE SCHEMA

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'faculty', 'admin')),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    oauth_provider VARCHAR(50),
    oauth_id VARCHAR(255)
);
```

### Students Table
```sql
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Primary Identifiers
    roll_no VARCHAR(50) UNIQUE NOT NULL,
    hall_ticket_no VARCHAR(50),
    admission_no VARCHAR(50),
    admission_date DATE NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    batch VARCHAR(20) NOT NULL,
    status VARCHAR(50) NOT NULL,
    
    -- Personal Details
    date_of_birth DATE NOT NULL,
    birth_place VARCHAR(255),
    blood_group VARCHAR(10),
    nationality VARCHAR(100),
    mother_tongue VARCHAR(100),
    religion VARCHAR(100),
    caste VARCHAR(100),
    resident_type VARCHAR(50),
    social_status VARCHAR(50),
    aadhaar_no VARCHAR(12),
    
    -- Contact Details
    landline_no VARCHAR(20),
    mobile_no VARCHAR(15) NOT NULL,
    personal_email VARCHAR(255),
    gender VARCHAR(20) NOT NULL,
    
    -- Identification
    identification_mark_1 VARCHAR(255) NOT NULL,
    identification_mark_2 VARCHAR(255),
    parish_name VARCHAR(255), -- for Catholic students only
    
    -- Address Details
    state VARCHAR(100),
    district VARCHAR(100),
    city_name VARCHAR(100),
    present_address TEXT,
    permanent_address TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Faculty Table
```sql
CREATE TABLE faculty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    faculty_name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    designation VARCHAR(100),
    employee_id VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Class Assignments Table
```sql
CREATE TABLE class_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID REFERENCES faculty(id),
    class_name VARCHAR(100) NOT NULL,
    batch VARCHAR(20) NOT NULL,
    department VARCHAR(100),
    subject VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Student Class Mapping
```sql
CREATE TABLE student_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id),
    class_assignment_id UUID REFERENCES class_assignments(id),
    enrolled_date DATE DEFAULT CURRENT_DATE
);
```

### Guardian Details Table
```sql
CREATE TABLE guardian_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    guardian_type VARCHAR(50), -- Father/Mother/Guardian
    guardian_name VARCHAR(255) NOT NULL,
    occupation VARCHAR(255),
    annual_income DECIMAL(15, 2),
    mobile_no VARCHAR(15),
    email VARCHAR(255),
    relation VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Previous Education Table
```sql
CREATE TABLE previous_education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    education_level VARCHAR(50), -- 10th/12th/Diploma/UG
    institution_name VARCHAR(255),
    board_university VARCHAR(255),
    year_of_passing INTEGER,
    percentage_cgpa DECIMAL(5, 2),
    subjects_studied TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Documents Table
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    document_type VARCHAR(100), -- Photo/Aadhaar/10th Mark Sheet/etc.
    document_name VARCHAR(255),
    file_path VARCHAR(500),
    file_size BIGINT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Semester Marks Table
```sql
CREATE TABLE semester_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id),
    semester INTEGER NOT NULL,
    academic_year VARCHAR(20),
    subject_code VARCHAR(50),
    subject_name VARCHAR(255),
    internal_marks DECIMAL(5, 2),
    external_marks DECIMAL(5, 2),
    total_marks DECIMAL(5, 2),
    grade VARCHAR(5),
    credits INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### OTP Table (for password reset)
```sql
CREATE TABLE otp_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT false,
    purpose VARCHAR(50) -- 'password_reset', 'email_verification'
);
```

---

## 4. API ENDPOINTS

### Authentication APIs

```
POST   /api/auth/login
POST   /api/auth/oauth/google
POST   /api/auth/logout
POST   /api/auth/password/request-otp
POST   /api/auth/password/verify-otp
POST   /api/auth/password/reset
GET    /api/auth/verify-token
```

### Student APIs

```
GET    /api/students/profile
PUT    /api/students/profile
GET    /api/students/:id
GET    /api/students/search
POST   /api/students/generate-application
GET    /api/students/:id/marks/:semester
POST   /api/students/:id/marks
```

### Faculty APIs

```
GET    /api/faculty/assigned-classes
GET    /api/faculty/students/:classId
PUT    /api/faculty/students/:studentId
GET    /api/faculty/students/:studentId/details
```

### Document Generation APIs

```
POST   /api/documents/generate-application
POST   /api/documents/generate-grade-memo
GET    /api/documents/:documentId/download
```

### Admin APIs

```
POST   /api/admin/students
POST   /api/admin/faculty
PUT    /api/admin/class-assignments
GET    /api/admin/reports
```

---

## 5. TECHNOLOGY STACK

### Frontend
- **Framework**: React.js with Next.js 14 (App Router)
- **UI Library**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand or React Context
- **Form Handling**: React Hook Form + Zod
- **HTTP Client**: Axios

### Backend
- **Framework**: Node.js + Express.js OR NestJS
- **Database**: PostgreSQL 15+
- **ORM**: Prisma OR TypeORM
- **Authentication**: 
  - Passport.js (OAuth)
  - JWT for session management
  - bcrypt for password hashing

### Document Generation
- **PDF Generation**: 
  - puppeteer (for complex layouts)
  - pdfkit (for programmatic generation)
- **Template Engine**: Handlebars or EJS
- **Excel/CSV**: ExcelJS

### Email Service
- **Service**: AWS SES or SendGrid
- **Library**: Nodemailer

### File Storage
- **Options**: 
  - AWS S3 (recommended for production)
  - Local storage (development)
  - Google Cloud Storage

### Deployment
- **Frontend**: Vercel or Netlify
- **Backend**: AWS EC2, DigitalOcean, or Railway
- **Database**: AWS RDS, Supabase, or Neon
- **Containerization**: Docker + Docker Compose

---

## 6. SECURITY IMPLEMENTATION

### Password Security
```javascript
// Password hashing
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

async function hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}
```

### JWT Token Generation
```javascript
const jwt = require('jsonwebtoken');

function generateAccessToken(user) {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        { id: user.id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );
}
```

### OTP Generation
```javascript
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTP(email, purpose) {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    await OTPToken.create({
        email,
        otp_code: otp,
        expires_at: expiresAt,
        purpose
    });
    
    await sendEmail(email, otp);
    return true;
}
```

### OAuth Configuration (Google)
```javascript
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails[0].value;
    
    // Only allow college domain
    if (!email.endsWith('@josephscollege.ac.in')) {
        return done(null, false, { message: 'Unauthorized domain' });
    }
    
    let user = await User.findOne({ email });
    
    if (!user) {
        user = await User.create({
            email,
            oauth_provider: 'google',
            oauth_id: profile.id,
            role: determineRole(email) // student or faculty
        });
    }
    
    return done(null, user);
  }
));
```

---

## 7. DOCUMENT GENERATION

### A. Student Application Generator

```javascript
const PDFDocument = require('pdfkit');
const fs = require('fs');

async function generateApplication(studentId, applicationType) {
    const student = await Student.findById(studentId).populate('user_id');
    
    const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });
    
    const filename = `application_${student.roll_no}_${Date.now()}.pdf`;
    const filepath = `./documents/applications/${filename}`;
    
    doc.pipe(fs.createWriteStream(filepath));
    
    // Header
    doc.fontSize(16).text('ST. JOSEPH\'S COLLEGE', { align: 'center' });
    doc.fontSize(12).text('(Autonomous)', { align: 'center' });
    doc.moveDown();
    
    // Application type
    doc.fontSize(14).text(`APPLICATION FOR ${applicationType.toUpperCase()}`, { 
        align: 'center',
        underline: true 
    });
    doc.moveDown(2);
    
    // Date
    doc.fontSize(11).text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();
    
    // To section
    doc.text('To,');
    doc.text('The Principal,');
    doc.text('St. Joseph\'s College,');
    doc.moveDown();
    
    // Subject
    doc.text(`Subject: Application for ${applicationType}`, { underline: true });
    doc.moveDown();
    
    // Salutation
    doc.text('Respected Sir/Madam,');
    doc.moveDown();
    
    // Body (template based on application type)
    const bodyText = getApplicationBody(applicationType, student);
    doc.text(bodyText, { align: 'justify' });
    doc.moveDown(2);
    
    // Closing
    doc.text('Thanking you,');
    doc.text('Yours obediently,');
    doc.moveDown(2);
    
    // Student details
    doc.text(student.student_name);
    doc.text(`Roll No: ${student.roll_no}`);
    doc.text(`Class: ${student.batch}`);
    doc.text(`Contact: ${student.mobile_no}`);
    
    doc.end();
    
    return filepath;
}

function getApplicationBody(type, student) {
    const templates = {
        'bonafide': `I am ${student.student_name}, a student of ${student.batch} studying in your esteemed institution with Roll Number ${student.roll_no}. I kindly request you to issue a Bonafide Certificate for [purpose]. This certificate is required for [reason].`,
        
        'leave': `I am ${student.student_name}, a student of ${student.batch} with Roll Number ${student.roll_no}. I am writing this letter to request leave from [start_date] to [end_date] due to [reason]. I assure you that I will complete all pending assignments and catch up on missed work.`,
        
        'transfer_certificate': `I am ${student.student_name}, a student of ${student.batch} with Roll Number ${student.roll_no}. Due to unavoidable circumstances, I need to discontinue my studies at this institution. I kindly request you to issue my Transfer Certificate at the earliest.`,
        
        // Add more templates as needed
    };
    
    return templates[type] || 'Application body text here.';
}
```

### B. Grade Memo Generator

```javascript
const ExcelJS = require('exceljs');

async function generateGradeMemo(studentId, semester) {
    const student = await Student.findById(studentId);
    const marks = await SemesterMarks.find({ 
        student_id: studentId, 
        semester: semester 
    }).sort({ subject_code: 1 });
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Grade Memo');
    
    // College Header
    worksheet.mergeCells('A1:H1');
    worksheet.getCell('A1').value = 'ST. JOSEPH\'S COLLEGE (AUTONOMOUS)';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    
    worksheet.mergeCells('A2:H2');
    worksheet.getCell('A2').value = 'GRADE MEMO';
    worksheet.getCell('A2').font = { size: 14, bold: true };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };
    
    // Student Details
    worksheet.addRow([]);
    worksheet.addRow(['Roll No:', student.roll_no, '', '', 'Name:', student.student_name]);
    worksheet.addRow(['Batch:', student.batch, '', '', 'Semester:', semester]);
    worksheet.addRow([]);
    
    // Table Headers
    const headerRow = worksheet.addRow([
        'S.No',
        'Subject Code',
        'Subject Name',
        'Internal',
        'External',
        'Total',
        'Grade',
        'Credits'
    ]);
    
    headerRow.font = { bold: true };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
    };
    
    // Add marks data
    let totalCredits = 0;
    let totalGradePoints = 0;
    
    marks.forEach((mark, index) => {
        worksheet.addRow([
            index + 1,
            mark.subject_code,
            mark.subject_name,
            mark.internal_marks,
            mark.external_marks,
            mark.total_marks,
            mark.grade,
            mark.credits
        ]);
        
        totalCredits += mark.credits;
        totalGradePoints += getGradePoint(mark.grade) * mark.credits;
    });
    
    // Add summary
    worksheet.addRow([]);
    const sgpa = (totalGradePoints / totalCredits).toFixed(2);
    worksheet.addRow(['', '', '', '', '', 'SGPA:', sgpa]);
    worksheet.addRow(['', '', '', '', '', 'Total Credits:', totalCredits]);
    
    // Styling
    worksheet.columns = [
        { width: 8 },
        { width: 15 },
        { width: 35 },
        { width: 12 },
        { width: 12 },
        { width: 10 },
        { width: 10 },
        { width: 10 }
    ];
    
    const filename = `grade_memo_${student.roll_no}_sem${semester}.xlsx`;
    await workbook.xlsx.writeFile(`./documents/grades/${filename}`);
    
    return filename;
}

function getGradePoint(grade) {
    const gradePoints = {
        'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 
        'C': 5, 'P': 4, 'F': 0, 'Ab': 0
    };
    return gradePoints[grade] || 0;
}
```

---

## 8. FRONTEND IMPLEMENTATION

### Login Page (Students)
```jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function StudentLogin() {
    const [rollNo, setRollNo] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    rollNo, 
                    password,
                    role: 'student'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                router.push('/student/dashboard');
            } else {
                alert('Invalid credentials');
            }
        } catch (error) {
            console.error('Login error:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const handleOAuthLogin = () => {
        window.location.href = '/api/auth/google';
    };
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <Card className="w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">St. Joseph's College</h1>
                    <p className="text-gray-600 mt-2">Student Portal Login</p>
                </div>
                
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Roll Number
                        </label>
                        <Input
                            type="text"
                            placeholder="e.g., 121423408057"
                            value={rollNo}
                            onChange={(e) => setRollNo(e.target.value)}
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Email: {rollNo}@josephscollege.ac.in
                        </p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    <Button 
                        type="submit" 
                        className="w-full"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </Button>
                </form>
                
                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or</span>
                        </div>
                    </div>
                    
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full mt-4"
                        onClick={handleOAuthLogin}
                    >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            {/* Google icon */}
                        </svg>
                        Login with College Account
                    </Button>
                </div>
                
                <div className="mt-6 text-center">
                    <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                        Forgot Password?
                    </a>
                </div>
            </Card>
        </div>
    );
}
```

### Student Dashboard
```jsx
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function StudentDashboard() {
    const [student, setStudent] = useState(null);
    
    useEffect(() => {
        fetchStudentData();
    }, []);
    
    const fetchStudentData = async () => {
        const response = await fetch('/api/students/profile', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        setStudent(data);
    };
    
    const handleGenerateApplication = async (type) => {
        const response = await fetch('/api/documents/generate-application', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ applicationType: type })
        });
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `application_${type}.pdf`;
        a.click();
    };
    
    if (!student) return <div>Loading...</div>;
    
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Student Dashboard</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="p-6">
                        <h3 className="font-semibold mb-2">Roll Number</h3>
                        <p className="text-2xl">{student.roll_no}</p>
                    </Card>
                    
                    <Card className="p-6">
                        <h3 className="font-semibold mb-2">Batch</h3>
                        <p className="text-2xl">{student.batch}</p>
                    </Card>
                    
                    <Card className="p-6">
                        <h3 className="font-semibold mb-2">Status</h3>
                        <p className="text-2xl">{student.status}</p>
                    </Card>
                </div>
                
                <Card className="p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4">Generate Documents</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button onClick={() => handleGenerateApplication('bonafide')}>
                            Bonafide Certificate
                        </Button>
                        <Button onClick={() => handleGenerateApplication('leave')}>
                            Leave Application
                        </Button>
                        <Button onClick={() => handleGenerateApplication('transfer_certificate')}>
                            Transfer Certificate
                        </Button>
                        <Button onClick={() => handleGenerateApplication('id_card')}>
                            ID Card Request
                        </Button>
                    </div>
                </Card>
                
                <Card className="p-6">
                    <h2 className="text-xl font-bold mb-4">Personal Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="font-semibold">Name:</label>
                            <p>{student.student_name}</p>
                        </div>
                        <div>
                            <label className="font-semibold">Date of Birth:</label>
                            <p>{new Date(student.date_of_birth).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <label className="font-semibold">Mobile:</label>
                            <p>{student.mobile_no}</p>
                        </div>
                        <div>
                            <label className="font-semibold">Email:</label>
                            <p>{student.personal_email}</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
```

### Faculty Student Management
```jsx
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

export default function FacultyStudentEdit({ params }) {
    const [student, setStudent] = useState(null);
    const [editing, setEditing] = useState(false);
    
    useEffect(() => {
        fetchStudent();
    }, []);
    
    const fetchStudent = async () => {
        const response = await fetch(`/api/faculty/students/${params.studentId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        setStudent(data);
    };
    
    const handleUpdate = async (e) => {
        e.preventDefault();
        
        const response = await fetch(`/api/faculty/students/${params.studentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(student)
        });
        
        if (response.ok) {
            alert('Student details updated successfully');
            setEditing(false);
        }
    };
    
    if (!student) return <div>Loading...</div>;
    
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Student Details</h1>
                    <Button onClick={() => setEditing(!editing)}>
                        {editing ? 'Cancel' : 'Edit Details'}
                    </Button>
                </div>
                
                <form onSubmit={handleUpdate}>
                    <Card className="p-6 mb-6">
                        <h2 className="text-xl font-bold mb-4">Primary Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block font-semibold mb-2">Roll Number</label>
                                <Input value={student.roll_no} disabled />
                            </div>
                            
                            <div>
                                <label className="block font-semibold mb-2">Hall Ticket No *</label>
                                <Input
                                    value={student.hall_ticket_no}
                                    onChange={(e) => setStudent({
                                        ...student,
                                        hall_ticket_no: e.target.value
                                    })}
                                    disabled={!editing}
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block font-semibold mb-2">Student Name *</label>
                                <Input
                                    value={student.student_name}
                                    onChange={(e) => setStudent({
                                        ...student,
                                        student_name: e.target.value
                                    })}
                                    disabled={!editing}
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block font-semibold mb-2">Admission Date *</label>
                                <Input
                                    type="date"
                                    value={student.admission_date}
                                    onChange={(e) => setStudent({
                                        ...student,
                                        admission_date: e.target.value
                                    })}
                                    disabled={!editing}
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block font-semibold mb-2">Batch *</label>
                                <Input
                                    value={student.batch}
                                    onChange={(e) => setStudent({
                                        ...student,
                                        batch: e.target.value
                                    })}
                                    disabled={!editing}
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block font-semibold mb-2">Status *</label>
                                <Select
                                    value={student.status}
                                    onChange={(e) => setStudent({
                                        ...student,
                                        status: e.target.value
                                    })}
                                    disabled={!editing}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Graduated">Graduated</option>
                                    <option value="Discontinued">Discontinued</option>
                                </Select>
                            </div>
                        </div>
                    </Card>
                    
                    <Card className="p-6 mb-6">
                        <h2 className="text-xl font-bold mb-4">Personal Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block font-semibold mb-2">Date of Birth *</label>
                                <Input
                                    type="date"
                                    value={student.date_of_birth}
                                    onChange={(e) => setStudent({
                                        ...student,
                                        date_of_birth: e.target.value
                                    })}
                                    disabled={!editing}
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block font-semibold mb-2">Birth Place</label>
                                <Input
                                    value={student.birth_place}
                                    onChange={(e) => setStudent({
                                        ...student,
                                        birth_place: e.target.value
                                    })}
                                    disabled={!editing}
                                />
                            </div>
                            
                            <div>
                                <label className="block font-semibold mb-2">Blood Group</label>
                                <Select
                                    value={student.blood_group}
                                    onChange={(e) => setStudent({
                                        ...student,
                                        blood_group: e.target.value
                                    })}
                                    disabled={!editing}
                                >
                                    <option value="">Select</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </Select>
                            </div>
                            
                            <div>
                                <label className="block font-semibold mb-2">Gender *</label>
                                <Select
                                    value={student.gender}
                                    onChange={(e) => setStudent({
                                        ...student,
                                        gender: e.target.value
                                    })}
                                    disabled={!editing}
                                    required
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </Select>
                            </div>
                            
                            <div>
                                <label className="block font-semibold mb-2">Mobile Number *</label>
                                <Input
                                    value={student.mobile_no}
                                    onChange={(e) => setStudent({
                                        ...student,
                                        mobile_no: e.target.value
                                    })}
                                    disabled={!editing}
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block font-semibold mb-2">Aadhaar Number</label>
                                <Input
                                    value={student.aadhaar_no}
                                    onChange={(e) => setStudent({
                                        ...student,
                                        aadhaar_no: e.target.value
                                    })}
                                    disabled={!editing}
                                    maxLength={12}
                                />
                            </div>
                            
                            {/* Add more fields as needed */}
                        </div>
                    </Card>
                    
                    {editing && (
                        <div className="flex justify-end">
                            <Button type="submit" className="px-8">
                                Save Changes
                            </Button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
```

---

## 9. DEPLOYMENT GUIDE

### Environment Variables (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/college_db

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-change-this
REFRESH_TOKEN_SECRET=your-refresh-token-secret-change-this

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_WORKSPACE_DOMAIN=josephscollege.ac.in

# Email Service (SendGrid/AWS SES)
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@josephscollege.ac.in

# File Storage
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_BUCKET_NAME=college-documents
AWS_REGION=us-east-1

# Application
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://portal.josephscollege.ac.in
```

### Docker Setup

```dockerfile
# Dockerfile (Backend)
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: college_db
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    environment:
      - DATABASE_URL=postgresql://admin:secure_password@postgres:5432/college_db
    volumes:
      - ./documents:/app/documents

  frontend:
    build: ./frontend
    ports:
      - "3001:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## 10. TESTING STRATEGY

### Unit Tests (Jest)
```javascript
describe('Authentication', () => {
    test('should hash password correctly', async () => {
        const password = 'testPassword123';
        const hash = await hashPassword(password);
        expect(hash).not.toBe(password);
    });
    
    test('should generate valid OTP', () => {
        const otp = generateOTP();
        expect(otp).toHaveLength(6);
        expect(Number(otp)).toBeGreaterThan(99999);
    });
    
    test('should validate college email domain', () => {
        expect(isValidCollegeEmail('121423408057@josephscollege.ac.in')).toBe(true);
        expect(isValidCollegeEmail('user@gmail.com')).toBe(false);
    });
});
```

---

## 11. FUTURE ENHANCEMENTS

1. **Mobile App** (React Native / Flutter)
2. **Attendance Management System**
3. **Fee Payment Integration**
4. **Library Management**
5. **Hostel Management**
6. **Event Management**
7. **Alumni Portal**
8. **Parent Portal**
9. **Placement Cell Management**
10. **Online Examination System**

---

## PROJECT TIMELINE

### Phase 1 (Weeks 1-2): Setup & Authentication
- Database design and setup
- Authentication system (OAuth + OTP)
- User management

### Phase 2 (Weeks 3-4): Student Module
- Student profile management
- Document generation system
- Dashboard implementation

### Phase 3 (Weeks 5-6): Faculty Module
- Class assignments
- Student data editing
- Grade management

### Phase 4 (Weeks 7-8): Testing & Deployment
- Integration testing
- Security audits
- Production deployment

---

## MAINTENANCE & SUPPORT

### Regular Tasks
- Database backups (Daily)
- Security updates (Weekly)
- Performance monitoring (Continuous)
- User support (Ongoing)

### Annual Tasks
- Academic year rollover
- Data archival
- System audits
- Feature enhancements

---

This comprehensive guide provides everything needed to build a production-ready Student Information System for St. Joseph's College. Adjust as needed based on specific requirements.