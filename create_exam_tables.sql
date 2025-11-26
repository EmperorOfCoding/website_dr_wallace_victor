-- Create exam_requests table
CREATE TABLE IF NOT EXISTS exam_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_id INT,
    exam_name VARCHAR(255) NOT NULL,
    status ENUM('requested', 'completed', 'cancelled') DEFAULT 'requested',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

-- Add columns to patient_documents
-- Check if columns exist before adding (using a stored procedure or just simple ALTERs that might fail if exists, but for this env simple ALTER is fine or we can use the check script logic)
-- Since MySQL doesn't have "IF NOT EXISTS" for columns in ALTER TABLE easily, we'll just run it. If it fails, it might be because it exists.
-- But to be safe and idempotent-ish for this session:

ALTER TABLE patient_documents ADD COLUMN exam_request_id INT DEFAULT NULL;
ALTER TABLE patient_documents ADD COLUMN type VARCHAR(50) DEFAULT 'document';
ALTER TABLE patient_documents ADD CONSTRAINT fk_exam_request FOREIGN KEY (exam_request_id) REFERENCES exam_requests(id);
