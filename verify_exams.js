require('dotenv').config();
const pool = require('./src/config/db');
const examService = require('./src/services/examService');
const documentService = require('./src/services/documentService');

async function verify() {
    try {
        console.log('Starting verification...');

        // 1. Get a doctor and a patient
        const [doctors] = await pool.execute('SELECT id FROM doctors LIMIT 1');
        const [patients] = await pool.execute('SELECT id FROM patients LIMIT 1');

        if (!doctors.length || !patients.length) {
            console.error('No doctor or patient found to test with.');
            process.exit(1);
        }

        const doctorId = doctors[0].id;
        const patientId = patients[0].id;
        console.log(`Testing with Doctor ID: ${doctorId}, Patient ID: ${patientId}`);

        // 2. Create Exam Request
        console.log('Creating exam request...');
        const pId = parseInt(patientId);
        const dId = parseInt(doctorId);

        const examId = await examService.createExamRequest({
            patient_id: pId,
            doctor_id: dId,
            appointment_id: null,
            exam_name: 'Teste Hemograma'
        });
        console.log(`Exam Request Created. ID: ${examId}`);

        // 3. List Exams
        console.log('Listing exams for patient...');
        const exams = await examService.getExamRequestsByPatient(patientId);
        const createdExam = exams.find(e => e.id === examId);

        if (!createdExam) {
            throw new Error('Created exam not found in list.');
        }
        console.log('Exam found in list:', createdExam.exam_name);

        // 4. Simulate Upload Result
        console.log('Uploading result document...');
        const mockFile = {
            originalname: 'resultado_teste.pdf',
            mimetype: 'application/pdf',
            size: 1024,
            buffer: Buffer.from('fake pdf content')
        };

        const doc = await documentService.saveDocument(
            patientId,
            mockFile,
            null,
            'Resultado do Hemograma',
            examId,
            'exam_result'
        );
        console.log(`Document saved. ID: ${doc.id}`);

        // 5. Verify Link
        console.log('Verifying exam-document link...');
        const examsAfterUpload = await examService.getExamRequestsByPatient(patientId);
        const updatedExam = examsAfterUpload.find(e => e.id === examId);

        if (updatedExam.document_id === doc.id) {
            console.log('SUCCESS: Exam is linked to document.');
        } else {
            console.error('FAILURE: Exam is NOT linked to document.', updatedExam);
        }

        // Update status
        await examService.updateExamRequestStatus(examId, 'completed');
        console.log('Exam status updated to completed.');

        console.log('Verification passed!');
        process.exit(0);
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
}

verify();
