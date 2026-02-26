// ============================================
// services/documentGenerator.js
// Complete Document Generation Service
// ============================================

const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const db = require('../config/database');

class DocumentGenerator {
    constructor() {
        this.documentsPath = process.env.DOCUMENTS_PATH || './documents';
        this.applicationsPath = path.join(this.documentsPath, 'applications');
        this.gradeMemoPath = path.join(this.documentsPath, 'grades');
        this.certificatesPath = path.join(this.documentsPath, 'certificates');
        
        // Ensure directories exist
        this.ensureDirectories();
    }
    
    ensureDirectories() {
        [this.applicationsPath, this.gradeMemoPath, this.certificatesPath].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    // ============================================
    // APPLICATION GENERATION
    // ============================================
    
    async generateApplication(studentId, applicationType, customData = {}) {
        try {
            // Fetch student data
            const studentQuery = `
                SELECT s.*, u.email 
                FROM students s 
                JOIN users u ON s.user_id = u.id 
                WHERE s.id = $1
            `;
            const result = await db.query(studentQuery, [studentId]);
            
            if (result.rows.length === 0) {
                throw new Error('Student not found');
            }
            
            const student = result.rows[0];
            
            // Generate PDF based on application type
            const filename = `${applicationType}_${student.roll_no}_${Date.now()}.pdf`;
            const filepath = path.join(this.applicationsPath, filename);
            
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 72, bottom: 72, left: 72, right: 72 }
            });
            
            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);
            
            // Generate based on type
            switch(applicationType.toLowerCase()) {
                case 'bonafide':
                    this.generateBonafide(doc, student, customData);
                    break;
                case 'leave':
                    this.generateLeaveApplication(doc, student, customData);
                    break;
                case 'transfer_certificate':
                    this.generateTCApplication(doc, student, customData);
                    break;
                case 'id_card':
                    this.generateIDCardRequest(doc, student, customData);
                    break;
                case 'no_objection':
                    this.generateNOC(doc, student, customData);
                    break;
                default:
                    this.generateGenericApplication(doc, student, applicationType, customData);
            }
            
            doc.end();
            
            // Wait for file to be written
            await new Promise((resolve, reject) => {
                stream.on('finish', resolve);
                stream.on('error', reject);
            });
            
            // Log document generation
            await this.logDocumentGeneration(studentId, student.user_id, 'Application', applicationType, filepath);
            
            return { filepath, filename };
            
        } catch (error) {
            console.error('Application generation error:', error);
            throw error;
        }
    }
    
    // Bonafide Certificate Application
    generateBonafide(doc, student, data) {
        // College Header
        this.addCollegeHeader(doc);
        
        // Title
        doc.moveDown(2);
        doc.fontSize(14).font('Helvetica-Bold')
           .text('APPLICATION FOR BONAFIDE CERTIFICATE', { align: 'center', underline: true });
        doc.moveDown(2);
        
        // Date
        doc.fontSize(11).font('Helvetica')
           .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
        doc.moveDown();
        
        // To section
        doc.text('To,');
        doc.text('The Principal,');
        doc.text('St. Joseph\'s College (Autonomous),');
        doc.text(process.env.COLLEGE_ADDRESS || '36, Lalbagh Road, Bangalore');
        doc.moveDown();
        
        // Subject
        doc.font('Helvetica-Bold').text('Subject: ', { continued: true })
           .font('Helvetica').text('Request for Bonafide Certificate');
        doc.moveDown();
        
        // Salutation
        doc.text('Respected Sir/Madam,');
        doc.moveDown();
        
        // Body
        const purpose = data.purpose || 'official purposes';
        const bodyText = `I am ${student.student_name}, a student of ${student.batch} with Roll Number ${student.roll_no}, studying in your esteemed institution. I kindly request you to issue a Bonafide Certificate for ${purpose}. This certificate is required for ${data.reason || 'submission to relevant authorities'}.`;
        
        doc.text(bodyText, { align: 'justify' });
        doc.moveDown();
        
        doc.text('I would be grateful if you could issue the certificate at the earliest convenience.');
        doc.moveDown(2);
        
        // Closing
        doc.text('Thanking you,');
        doc.text('Yours sincerely,');
        doc.moveDown(3);
        
        // Student Details
        doc.font('Helvetica-Bold').text(student.student_name);
        doc.font('Helvetica')
           .text(`Roll No: ${student.roll_no}`)
           .text(`Class: ${student.batch}`)
           .text(`Mobile: ${student.mobile_no}`)
           .text(`Email: ${student.email}`);
    }
    
    // Leave Application
    generateLeaveApplication(doc, student, data) {
        this.addCollegeHeader(doc);
        
        doc.moveDown(2);
        doc.fontSize(14).font('Helvetica-Bold')
           .text('LEAVE APPLICATION', { align: 'center', underline: true });
        doc.moveDown(2);
        
        doc.fontSize(11).font('Helvetica')
           .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
        doc.moveDown();
        
        doc.text('To,');
        doc.text('The Principal,');
        doc.text('St. Joseph\'s College (Autonomous)');
        doc.moveDown();
        
        doc.font('Helvetica-Bold').text('Subject: ', { continued: true })
           .font('Helvetica').text('Application for Leave');
        doc.moveDown();
        
        doc.text('Respected Sir/Madam,');
        doc.moveDown();
        
        const fromDate = data.fromDate || '[Start Date]';
        const toDate = data.toDate || '[End Date]';
        const reason = data.reason || '[Reason for leave]';
        
        const bodyText = `I am ${student.student_name}, a student of ${student.batch} with Roll Number ${student.roll_no}. I am writing this letter to request leave from ${fromDate} to ${toDate} due to ${reason}. I assure you that I will complete all pending assignments and catch up on missed work upon my return.`;
        
        doc.text(bodyText, { align: 'justify' });
        doc.moveDown();
        
        doc.text('I request you to kindly grant me leave for the mentioned period.');
        doc.moveDown(2);
        
        doc.text('Thanking you,');
        doc.text('Yours obediently,');
        doc.moveDown(3);
        
        this.addStudentSignature(doc, student);
    }
    
    // Transfer Certificate Application
    generateTCApplication(doc, student, data) {
        this.addCollegeHeader(doc);
        
        doc.moveDown(2);
        doc.fontSize(14).font('Helvetica-Bold')
           .text('APPLICATION FOR TRANSFER CERTIFICATE', { align: 'center', underline: true });
        doc.moveDown(2);
        
        doc.fontSize(11).font('Helvetica')
           .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
        doc.moveDown();
        
        doc.text('To,');
        doc.text('The Principal,');
        doc.text('St. Joseph\'s College (Autonomous)');
        doc.moveDown();
        
        doc.font('Helvetica-Bold').text('Subject: ', { continued: true })
           .font('Helvetica').text('Request for Transfer Certificate');
        doc.moveDown();
        
        doc.text('Respected Sir/Madam,');
        doc.moveDown();
        
        const reason = data.reason || 'personal reasons';
        const bodyText = `I am ${student.student_name}, a student of ${student.batch} with Roll Number ${student.roll_no}. Due to ${reason}, I need to discontinue my studies at this institution. I kindly request you to issue my Transfer Certificate at the earliest convenience so that I can pursue my education elsewhere.`;
        
        doc.text(bodyText, { align: 'justify' });
        doc.moveDown();
        
        doc.text('I have cleared all my dues and returned all library books and other college property.');
        doc.moveDown(2);
        
        doc.text('Thanking you,');
        doc.text('Yours faithfully,');
        doc.moveDown(3);
        
        this.addStudentSignature(doc, student);
    }
    
    // ID Card Request
    generateIDCardRequest(doc, student, data) {
        this.addCollegeHeader(doc);
        
        doc.moveDown(2);
        doc.fontSize(14).font('Helvetica-Bold')
           .text('APPLICATION FOR ID CARD', { align: 'center', underline: true });
        doc.moveDown(2);
        
        doc.fontSize(11).font('Helvetica')
           .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
        doc.moveDown();
        
        doc.text('To,');
        doc.text('The Principal,');
        doc.text('St. Joseph\'s College (Autonomous)');
        doc.moveDown();
        
        const requestType = data.requestType || 'new';
        const subject = requestType === 'duplicate' ? 
            'Request for Duplicate ID Card' : 
            'Request for ID Card';
        
        doc.font('Helvetica-Bold').text('Subject: ', { continued: true })
           .font('Helvetica').text(subject);
        doc.moveDown();
        
        doc.text('Respected Sir/Madam,');
        doc.moveDown();
        
        let bodyText;
        if (requestType === 'duplicate') {
            const reason = data.reason || 'it was lost';
            bodyText = `I am ${student.student_name}, a student of ${student.batch} with Roll Number ${student.roll_no}. I am writing to request a duplicate ID card as ${reason}. I am ready to pay the required fee for the same.`;
        } else {
            bodyText = `I am ${student.student_name}, a student of ${student.batch} with Roll Number ${student.roll_no}. I kindly request you to issue me a college ID card. I have enclosed the necessary documents and passport-sized photographs as required.`;
        }
        
        doc.text(bodyText, { align: 'justify' });
        doc.moveDown(2);
        
        doc.text('Thanking you,');
        doc.text('Yours sincerely,');
        doc.moveDown(3);
        
        this.addStudentSignature(doc, student);
    }
    
    // No Objection Certificate Application
    generateNOC(doc, student, data) {
        this.addCollegeHeader(doc);
        
        doc.moveDown(2);
        doc.fontSize(14).font('Helvetica-Bold')
           .text('APPLICATION FOR NO OBJECTION CERTIFICATE', { align: 'center', underline: true });
        doc.moveDown(2);
        
        doc.fontSize(11).font('Helvetica')
           .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
        doc.moveDown();
        
        doc.text('To,');
        doc.text('The Principal,');
        doc.text('St. Joseph\'s College (Autonomous)');
        doc.moveDown();
        
        doc.font('Helvetica-Bold').text('Subject: ', { continued: true })
           .font('Helvetica').text('Request for No Objection Certificate');
        doc.moveDown();
        
        doc.text('Respected Sir/Madam,');
        doc.moveDown();
        
        const purpose = data.purpose || '[specify purpose]';
        const bodyText = `I am ${student.student_name}, a student of ${student.batch} with Roll Number ${student.roll_no}. I kindly request you to issue a No Objection Certificate for ${purpose}. This certificate is required to ${data.reason || 'proceed with the mentioned activity'}.`;
        
        doc.text(bodyText, { align: 'justify' });
        doc.moveDown();
        
        doc.text('I assure you that this activity will not affect my academic performance.');
        doc.moveDown(2);
        
        doc.text('Thanking you,');
        doc.text('Yours obediently,');
        doc.moveDown(3);
        
        this.addStudentSignature(doc, student);
    }
    
    // Generic Application Template
    generateGenericApplication(doc, student, applicationType, data) {
        this.addCollegeHeader(doc);
        
        doc.moveDown(2);
        doc.fontSize(14).font('Helvetica-Bold')
           .text(`APPLICATION FOR ${applicationType.toUpperCase()}`, { align: 'center', underline: true });
        doc.moveDown(2);
        
        doc.fontSize(11).font('Helvetica')
           .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
        doc.moveDown();
        
        doc.text('To,');
        doc.text('The Principal,');
        doc.text('St. Joseph\'s College (Autonomous)');
        doc.moveDown();
        
        doc.font('Helvetica-Bold').text('Subject: ', { continued: true })
           .font('Helvetica').text(`Application for ${applicationType}`);
        doc.moveDown();
        
        doc.text('Respected Sir/Madam,');
        doc.moveDown();
        
        const bodyText = data.body || `I am ${student.student_name}, a student of ${student.batch} with Roll Number ${student.roll_no}. I am writing this application to request ${applicationType}. [Please provide detailed reason and context.]`;
        
        doc.text(bodyText, { align: 'justify' });
        doc.moveDown(2);
        
        doc.text('Thanking you,');
        doc.text('Yours sincerely,');
        doc.moveDown(3);
        
        this.addStudentSignature(doc, student);
    }
    
    // ============================================
    // GRADE MEMO GENERATION (Excel)
    // ============================================
    
    async generateGradeMemo(studentId, semester, academicYear = null) {
        try {
            // Fetch student data
            const studentQuery = `
                SELECT s.*, u.email 
                FROM students s 
                JOIN users u ON s.user_id = u.id 
                WHERE s.id = $1
            `;
            const studentResult = await db.query(studentQuery, [studentId]);
            
            if (studentResult.rows.length === 0) {
                throw new Error('Student not found');
            }
            
            const student = studentResult.rows[0];
            
            // Fetch marks for the semester
            const marksQuery = `
                SELECT * FROM semester_marks 
                WHERE student_id = $1 AND semester = $2
                ${academicYear ? 'AND academic_year = $3' : ''}
                ORDER BY subject_code
            `;
            const queryParams = academicYear ? 
                [studentId, semester, academicYear] : 
                [studentId, semester];
            
            const marksResult = await db.query(marksQuery, queryParams);
            
            if (marksResult.rows.length === 0) {
                throw new Error('No marks found for this semester');
            }
            
            const marks = marksResult.rows;
            
            // Create Excel workbook
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Grade Memo');
            
            // Set column widths
            worksheet.columns = [
                { width: 8 },   // S.No
                { width: 15 },  // Subject Code
                { width: 35 },  // Subject Name
                { width: 12 },  // Internal
                { width: 12 },  // External
                { width: 12 },  // Practical
                { width: 10 },  // Total
                { width: 10 },  // Grade
                { width: 10 }   // Credits
            ];
            
            // College Header
            worksheet.mergeCells('A1:I1');
            const headerCell = worksheet.getCell('A1');
            headerCell.value = 'ST. JOSEPH\'S COLLEGE (AUTONOMOUS)';
            headerCell.font = { size: 16, bold: true };
            headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
            headerCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
            worksheet.mergeCells('A2:I2');
            const subtitleCell = worksheet.getCell('A2');
            subtitleCell.value = 'GRADE MEMO';
            subtitleCell.font = { size: 14, bold: true };
            subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            
            // Student Information
            worksheet.addRow([]);
            
            worksheet.getCell('A4').value = 'Roll No:';
            worksheet.getCell('A4').font = { bold: true };
            worksheet.getCell('B4').value = student.roll_no;
            
            worksheet.getCell('E4').value = 'Name:';
            worksheet.getCell('E4').font = { bold: true };
            worksheet.mergeCells('F4:I4');
            worksheet.getCell('F4').value = student.student_name;
            
            worksheet.getCell('A5').value = 'Class:';
            worksheet.getCell('A5').font = { bold: true };
            worksheet.getCell('B5').value = student.batch;
            
            worksheet.getCell('E5').value = 'Semester:';
            worksheet.getCell('E5').font = { bold: true };
            worksheet.getCell('F5').value = semester;
            
            if (academicYear) {
                worksheet.getCell('A6').value = 'Academic Year:';
                worksheet.getCell('A6').font = { bold: true };
                worksheet.getCell('B6').value = academicYear;
            }
            
            worksheet.addRow([]);
            
            // Table Headers
            const headerRow = worksheet.addRow([
                'S.No',
                'Subject Code',
                'Subject Name',
                'Internal',
                'External',
                'Practical',
                'Total',
                'Grade',
                'Credits'
            ]);
            
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.height = 25;
            headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4472C4' }
            };
            
            // Add borders to header
            headerRow.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
            
            // Add Marks Data
            let totalCredits = 0;
            let totalGradePoints = 0;
            
            marks.forEach((mark, index) => {
                const row = worksheet.addRow([
                    index + 1,
                    mark.subject_code,
                    mark.subject_name,
                    mark.internal_marks || '-',
                    mark.external_marks || '-',
                    mark.practical_marks || '-',
                    mark.total_marks,
                    mark.grade,
                    mark.credits
                ]);
                
                row.alignment = { horizontal: 'center', vertical: 'middle' };
                
                // Add borders
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
                
                // Color code based on result
                if (mark.result_status === 'Fail' || mark.grade === 'F') {
                    row.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFFCCCC' }  // Light red
                    };
                }
                
                totalCredits += mark.credits || 0;
                totalGradePoints += (this.getGradePoint(mark.grade) * (mark.credits || 0));
            });
            
            // Summary Section
            worksheet.addRow([]);
            
            const sgpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '0.00';
            
            const summaryRow1 = worksheet.addRow(['', '', '', '', '', 'Total Credits:', totalCredits, '', '']);
            summaryRow1.getCell(6).font = { bold: true };
            summaryRow1.getCell(7).font = { bold: true };
            
            const summaryRow2 = worksheet.addRow(['', '', '', '', '', 'SGPA:', sgpa, '', '']);
            summaryRow2.getCell(6).font = { bold: true, size: 12 };
            summaryRow2.getCell(7).font = { bold: true, size: 12 };
            summaryRow2.getCell(7).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFFF00' }  // Yellow
            };
            
            // Add grading system reference
            worksheet.addRow([]);
            worksheet.addRow([]);
            
            const gradingHeader = worksheet.addRow(['Grading System:']);
            gradingHeader.getCell(1).font = { bold: true, size: 11 };
            
            const gradeScale = [
                ['Grade', 'Grade Point', 'Percentage Range'],
                ['O', '10', '90-100'],
                ['A+', '9', '80-89'],
                ['A', '8', '70-79'],
                ['B+', '7', '60-69'],
                ['B', '6', '55-59'],
                ['C', '5', '50-54'],
                ['P', '4', '40-49'],
                ['F', '0', 'Below 40']
            ];
            
            gradeScale.forEach((row, index) => {
                const excelRow = worksheet.addRow(row);
                if (index === 0) {
                    excelRow.font = { bold: true };
                    excelRow.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFD3D3D3' }
                    };
                }
            });
            
            // Save file
            const filename = `grade_memo_${student.roll_no}_sem${semester}_${Date.now()}.xlsx`;
            const filepath = path.join(this.gradeMemoPath, filename);
            
            await workbook.xlsx.writeFile(filepath);
            
            // Log document generation
            await this.logDocumentGeneration(studentId, student.user_id, 'Grade Memo', null, filepath, semester, academicYear);
            
            return { filepath, filename };
            
        } catch (error) {
            console.error('Grade memo generation error:', error);
            throw error;
        }
    }
    
    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    
    addCollegeHeader(doc) {
        doc.fontSize(16).font('Helvetica-Bold')
           .text('ST. JOSEPH\'S COLLEGE', { align: 'center' });
        doc.fontSize(12).font('Helvetica')
           .text('(Autonomous)', { align: 'center' });
        doc.fontSize(10)
           .text(process.env.COLLEGE_ADDRESS || '36, Lalbagh Road, Bangalore - 560027', { align: 'center' })
           .text(`Phone: ${process.env.COLLEGE_PHONE || '+91-80-22211429'}`, { align: 'center' });
        
        doc.moveDown();
        doc.moveTo(72, doc.y)
           .lineTo(523, doc.y)
           .stroke();
    }
    
    addStudentSignature(doc, student) {
        doc.font('Helvetica-Bold').text(student.student_name);
        doc.font('Helvetica')
           .text(`Roll No: ${student.roll_no}`)
           .text(`Class: ${student.batch}`)
           .text(`Mobile: ${student.mobile_no}`)
           .text(`Email: ${student.email}`);
    }
    
    getGradePoint(grade) {
        const gradePoints = {
            'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 
            'C': 5, 'P': 4, 'F': 0, 'Ab': 0
        };
        return gradePoints[grade] || 0;
    }
    
    async logDocumentGeneration(studentId, generatedBy, documentType, applicationType, filepath, semester = null, academicYear = null) {
        const query = `
            INSERT INTO generated_documents 
            (student_id, generated_by, document_type, application_type, file_path, file_name, semester, academic_year)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        
        const filename = path.basename(filepath);
        
        await db.query(query, [
            studentId,
            generatedBy,
            documentType,
            applicationType,
            filepath,
            filename,
            semester,
            academicYear
        ]);
    }
}

module.exports = new DocumentGenerator();

// ============================================
// USAGE EXAMPLES
// ============================================

/*
const documentGenerator = require('./services/documentGenerator');

// Generate Bonafide Certificate
const result1 = await documentGenerator.generateApplication(
    'student-uuid',
    'bonafide',
    {
        purpose: 'Passport Application',
        reason: 'submission to Passport Office'
    }
);

// Generate Leave Application
const result2 = await documentGenerator.generateApplication(
    'student-uuid',
    'leave',
    {
        fromDate: '2024-03-15',
        toDate: '2024-03-20',
        reason: 'medical reasons'
    }
);

// Generate Grade Memo
const result3 = await documentGenerator.generateGradeMemo(
    'student-uuid',
    1,  // Semester
    '2024-2025'  // Academic Year
);

console.log('Generated:', result3.filepath);
*/