n-- ============================================
-- St. Joseph's College SIS - Database Migration
-- PostgreSQL 15+
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. USERS TABLE (Core Authentication)
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'faculty', 'admin')),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    oauth_provider VARCHAR(50),
    oauth_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- 2. STUDENTS TABLE (Complete Student Information)
-- ============================================
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Primary Identifiers (Required fields marked with comments)
    roll_no VARCHAR(50) UNIQUE NOT NULL,                    -- REQUIRED
    hall_ticket_no VARCHAR(50),                             -- REQUIRED
    admission_no VARCHAR(50),
    admission_date DATE NOT NULL,                           -- REQUIRED
    student_name VARCHAR(255) NOT NULL,                     -- REQUIRED
    batch VARCHAR(20) NOT NULL,                             -- REQUIRED (e.g., "2024-2028", "BCA 2024")
    status VARCHAR(50) NOT NULL,                            -- REQUIRED (Active/Inactive/Graduated/Discontinued)
    
    -- Personal Details
    date_of_birth DATE NOT NULL,                            -- REQUIRED
    birth_place VARCHAR(255),
    blood_group VARCHAR(10),
    nationality VARCHAR(100) DEFAULT 'Indian',
    mother_tongue VARCHAR(100),
    religion VARCHAR(100),
    caste VARCHAR(100),
    resident_type VARCHAR(50),                              -- Day Scholar/Hosteller
    social_status VARCHAR(50),                              -- General/OBC/SC/ST/Others
    aadhaar_no VARCHAR(12) UNIQUE,
    
    -- Contact Details
    landline_no VARCHAR(20),
    mobile_no VARCHAR(15) NOT NULL,                         -- REQUIRED
    personal_email VARCHAR(255),
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),  -- REQUIRED
    
    -- Identification Marks
    identification_mark_1 VARCHAR(255) NOT NULL,            -- REQUIRED
    identification_mark_2 VARCHAR(255),
    
    -- Religious Information (Optional - only for Catholic students)
    parish_name VARCHAR(255),
    
    -- Address Details
    state VARCHAR(100),
    district VARCHAR(100),
    city_name VARCHAR(100),
    present_address TEXT,
    permanent_address TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_students_roll_no ON students(roll_no);
CREATE INDEX idx_students_batch ON students(batch);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_user_id ON students(user_id);

-- ============================================
-- 3. FACULTY TABLE
-- ============================================
CREATE TABLE faculty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    faculty_name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50) UNIQUE,
    department VARCHAR(100),
    designation VARCHAR(100),
    qualification VARCHAR(255),
    specialization VARCHAR(255),
    joining_date DATE,
    mobile_no VARCHAR(15),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_faculty_user_id ON faculty(user_id);
CREATE INDEX idx_faculty_department ON faculty(department);

-- ============================================
-- 4. CLASS ASSIGNMENTS TABLE (Faculty-Class Mapping)
-- ============================================
CREATE TABLE class_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
    
    class_name VARCHAR(100) NOT NULL,                       -- e.g., "BCA 2nd Year A"
    batch VARCHAR(20) NOT NULL,                             -- e.g., "2023-2026"
    department VARCHAR(100),                                -- e.g., "Computer Science"
    section VARCHAR(10),                                    -- A, B, C
    subject VARCHAR(255),
    academic_year VARCHAR(20),                              -- e.g., "2024-2025"
    semester INTEGER,
    
    is_class_teacher BOOLEAN DEFAULT false,                 -- Flag for class teacher
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(faculty_id, class_name, batch, subject)
);

CREATE INDEX idx_class_assignments_faculty ON class_assignments(faculty_id);
CREATE INDEX idx_class_assignments_batch ON class_assignments(batch);

-- ============================================
-- 5. STUDENT-CLASS MAPPING
-- ============================================
CREATE TABLE student_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_assignment_id UUID REFERENCES class_assignments(id) ON DELETE CASCADE,
    
    enrolled_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'Active',                    -- Active/Withdrawn/Completed
    
    UNIQUE(student_id, class_assignment_id)
);

CREATE INDEX idx_student_classes_student ON student_classes(student_id);
CREATE INDEX idx_student_classes_assignment ON student_classes(class_assignment_id);

-- ============================================
-- 6. GUARDIAN DETAILS TABLE
-- ============================================
CREATE TABLE guardian_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    
    guardian_type VARCHAR(50) NOT NULL,                     -- Father/Mother/Guardian
    guardian_name VARCHAR(255) NOT NULL,
    relation VARCHAR(100),                                  -- If guardian_type is 'Guardian'
    occupation VARCHAR(255),
    organization VARCHAR(255),
    designation VARCHAR(100),
    annual_income DECIMAL(15, 2),
    mobile_no VARCHAR(15),
    email VARCHAR(255),
    address TEXT,
    
    is_primary_contact BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_guardian_student ON guardian_details(student_id);

-- ============================================
-- 7. PREVIOUS EDUCATION TABLE
-- ============================================
CREATE TABLE previous_education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    
    education_level VARCHAR(50) NOT NULL,                   -- 10th/12th/Diploma/UG
    institution_name VARCHAR(255) NOT NULL,
    board_university VARCHAR(255),
    year_of_passing INTEGER,
    percentage_cgpa DECIMAL(5, 2),
    grade VARCHAR(10),
    subjects_studied TEXT,
    medium_of_instruction VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prev_education_student ON previous_education(student_id);

-- ============================================
-- 8. DOCUMENTS TABLE (Student Document Storage)
-- ============================================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    
    document_type VARCHAR(100) NOT NULL,                    -- Photo/Aadhaar/10th Certificate/12th Certificate/etc.
    document_category VARCHAR(50),                          -- Personal/Academic/Identity
    document_name VARCHAR(255),
    file_path VARCHAR(500),
    file_size BIGINT,
    mime_type VARCHAR(100),
    
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_student ON documents(student_id);
CREATE INDEX idx_documents_type ON documents(document_type);

-- ============================================
-- 9. SEMESTER MARKS TABLE
-- ============================================
CREATE TABLE semester_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    
    semester INTEGER NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    subject_code VARCHAR(50) NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    
    -- Marks breakdown
    internal_marks DECIMAL(5, 2),
    external_marks DECIMAL(5, 2),
    practical_marks DECIMAL(5, 2),
    assignment_marks DECIMAL(5, 2),
    total_marks DECIMAL(5, 2),
    
    max_marks DECIMAL(5, 2) DEFAULT 100,
    
    -- Grading
    grade VARCHAR(5),                                       -- O/A+/A/B+/B/C/P/F/Ab
    grade_point DECIMAL(3, 2),                             -- 10.00/9.00/8.00/etc.
    credits INTEGER,
    
    -- Status
    result_status VARCHAR(20),                              -- Pass/Fail/Absent/Withheld
    
    -- Entry metadata
    entered_by UUID REFERENCES users(id),                   -- Faculty who entered marks
    entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(student_id, semester, subject_code)
);

CREATE INDEX idx_semester_marks_student ON semester_marks(student_id);
CREATE INDEX idx_semester_marks_semester ON semester_marks(semester);

-- ============================================
-- 10. OTP TOKENS TABLE (Password Reset & Verification)
-- ============================================
CREATE TABLE otp_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    purpose VARCHAR(50) NOT NULL,                           -- password_reset/email_verification/2fa
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP,
    
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_otp_email ON otp_tokens(email);
CREATE INDEX idx_otp_expires ON otp_tokens(expires_at);

-- Auto-delete expired OTPs (optional cleanup)
CREATE OR REPLACE FUNCTION delete_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM otp_tokens WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 11. ATTENDANCE TABLE (Optional - Future Enhancement)
-- ============================================
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_assignment_id UUID REFERENCES class_assignments(id),
    
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Present', 'Absent', 'Late', 'On Leave')),
    remarks TEXT,
    
    marked_by UUID REFERENCES users(id),
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(student_id, class_assignment_id, attendance_date)
);

CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);

-- ============================================
-- 12. GENERATED DOCUMENTS LOG (Track Document Generation)
-- ============================================
CREATE TABLE generated_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    student_id UUID REFERENCES students(id),
    generated_by UUID REFERENCES users(id),
    
    document_type VARCHAR(100) NOT NULL,                    -- Application/Grade Memo/Certificate
    application_type VARCHAR(100),                          -- Bonafide/Leave/TC (for applications)
    
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    
    semester INTEGER,                                       -- For grade memos
    academic_year VARCHAR(20),
    
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_generated_docs_student ON generated_documents(student_id);
CREATE INDEX idx_generated_docs_type ON generated_documents(document_type);

-- ============================================
-- 13. AUDIT LOG (Track All Changes - Optional but Recommended)
-- ============================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id UUID REFERENCES users(id),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    
    old_values JSONB,
    new_values JSONB,
    
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_table ON audit_log(table_name);
CREATE INDEX idx_audit_record ON audit_log(record_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- ============================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faculty_updated_at
    BEFORE UPDATE ON faculty
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guardian_details_updated_at
    BEFORE UPDATE ON guardian_details
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (For Testing)
-- ============================================

-- Insert Admin User
INSERT INTO users (email, password_hash, role, is_active) VALUES
('admin@josephscollege.ac.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lWmjrR.k3M8G', 'admin', true);
-- Password: Admin@123

-- Insert Sample Faculty
INSERT INTO users (email, password_hash, role, is_active) VALUES
('john.doe@josephscollege.ac.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lWmjrR.k3M8G', 'faculty', true);

INSERT INTO faculty (user_id, faculty_name, employee_id, department, designation) VALUES
((SELECT id FROM users WHERE email = 'john.doe@josephscollege.ac.in'), 'Dr. John Doe', 'FAC001', 'Computer Science', 'Associate Professor');

-- Insert Sample Student
INSERT INTO users (email, role, is_active) VALUES
('121423408057@josephscollege.ac.in', 'student', true);

INSERT INTO students (
    user_id, roll_no, hall_ticket_no, admission_date, student_name, batch, status,
    date_of_birth, mobile_no, gender, identification_mark_1, 
    present_address, permanent_address
) VALUES (
    (SELECT id FROM users WHERE email = '121423408057@josephscollege.ac.in'),
    '121423408057',
    'HT2024001',
    '2024-06-15',
    'Sample Student',
    'BCA 2024-2027',
    'Active',
    '2005-08-15',
    '9876543210',
    'Male',
    'Mole on left hand',
    '123 Sample Street, City',
    '123 Sample Street, City'
);

-- ============================================
-- USEFUL QUERIES FOR REFERENCE
-- ============================================

-- Get complete student profile
-- SELECT s.*, u.email 
-- FROM students s 
-- JOIN users u ON s.user_id = u.id 
-- WHERE s.roll_no = '121423408057';

-- Get faculty's assigned classes
-- SELECT ca.*, f.faculty_name 
-- FROM class_assignments ca
-- JOIN faculty f ON ca.faculty_id = f.id
-- WHERE f.user_id = 'faculty-user-uuid';

-- Get students in a specific class
-- SELECT s.* 
-- FROM students s
-- JOIN student_classes sc ON s.id = sc.student_id
-- WHERE sc.class_assignment_id = 'class-uuid' AND sc.status = 'Active';

-- Calculate SGPA for a student in a semester
-- SELECT 
--     student_id,
--     semester,
--     SUM(grade_point * credits) / SUM(credits) as SGPA,
--     SUM(credits) as total_credits
-- FROM semester_marks
-- WHERE student_id = 'student-uuid' AND semester = 1
-- GROUP BY student_id, semester;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Composite indexes for common queries
CREATE INDEX idx_students_batch_status ON students(batch, status);
CREATE INDEX idx_semester_marks_student_sem ON semester_marks(student_id, semester);
CREATE INDEX idx_class_assignments_faculty_batch ON class_assignments(faculty_id, batch);

-- Full-text search index for student names (optional)
CREATE INDEX idx_students_name_gin ON students USING gin(to_tsvector('english', student_name));

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Student Profile View
CREATE OR REPLACE VIEW v_student_profiles AS
SELECT 
    s.*,
    u.email,
    u.last_login,
    u.is_active as account_active
FROM students s
JOIN users u ON s.user_id = u.id;

-- Faculty with Classes View
CREATE OR REPLACE VIEW v_faculty_classes AS
SELECT 
    f.id as faculty_id,
    f.faculty_name,
    f.department,
    ca.class_name,
    ca.batch,
    ca.subject,
    ca.is_class_teacher,
    COUNT(DISTINCT sc.student_id) as student_count
FROM faculty f
LEFT JOIN class_assignments ca ON f.id = ca.faculty_id
LEFT JOIN student_classes sc ON ca.id = sc.class_assignment_id
GROUP BY f.id, f.faculty_name, f.department, ca.id, ca.class_name, ca.batch, ca.subject, ca.is_class_teacher;

-- Student Academic Summary View
CREATE OR REPLACE VIEW v_student_academic_summary AS
SELECT 
    s.id as student_id,
    s.roll_no,
    s.student_name,
    s.batch,
    sm.semester,
    COUNT(sm.id) as total_subjects,
    SUM(sm.credits) as total_credits,
    ROUND(SUM(sm.grade_point * sm.credits)::NUMERIC / NULLIF(SUM(sm.credits), 0), 2) as sgpa
FROM students s
LEFT JOIN semester_marks sm ON s.id = sm.student_id
GROUP BY s.id, s.roll_no, s.student_name, s.batch, sm.semester
ORDER BY s.roll_no, sm.semester;

-- ============================================
-- GRANTS (Adjust based on your user setup)
-- ============================================

-- Grant appropriate permissions to application user
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO college_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO college_app_user;

-- ============================================
-- BACKUP RECOMMENDATIONS
-- ============================================
-- 1. Daily automated backups: pg_dump college_db > backup_$(date +%Y%m%d).sql
-- 2. Store backups in secure location (AWS S3, etc.)
-- 3. Test restore procedures monthly
-- 4. Keep backups for at least 30 days

COMMIT;