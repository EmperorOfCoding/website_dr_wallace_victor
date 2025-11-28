// Batch update script for API configuration
const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    'c:/Users/victo/OneDrive/Desktop/website_dr_wallace_victor-2/frontend/src/pages/AdminDashboard.jsx',
    'c:/Users/victo/OneDrive/Desktop/website_dr_wallace_victor-2/frontend/src/pages/AdminCalendar.jsx',
    'c:/Users/victo/OneDrive/Desktop/website_dr_wallace_victor-2/frontend/src/pages/AdminAgenda.jsx',
    'c:/Users/victo/OneDrive/Desktop/website_dr_wallace_victor-2/frontend/src/pages/AdminPatients.jsx',
    'c:/Users/victo/OneDrive/Desktop/website_dr_wallace_victor-2/frontend/src/pages/AdminPatientDetails.jsx',
    'c:/Users/victo/OneDrive/Desktop/website_dr_wallace_victor-2/frontend/src/pages/AdminMetrics.jsx',
    'c:/Users/victo/OneDrive/Desktop/website_dr_wallace_victor-2/frontend/src/pages/DoctorProfile.jsx',
    'c:/Users/victo/OneDrive/Desktop/website_dr_wallace_victor-2/frontend/src/pages/DocumentUpload.jsx',
    'c:/Users/victo/OneDrive/Desktop/website_dr_wallace_victor-2/frontend/src/pages/PatientExams.jsx',
    'c:/Users/victo/OneDrive/Desktop/website_dr_wallace_victor-2/frontend/src/pages/ReviewAppointment.jsx',
    'c:/Users/victo/OneDrive/Desktop/website_dr_wallace_victor-2/frontend/src/pages/AppointmentDetails.jsx',
    'c:/Users/victo/OneDrive/Desktop/website_dr_wallace_victor-2/frontend/src/components/ExamPanel.jsx',
];

filesToUpdate.forEach(filePath => {
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`Skipped (not found): ${filePath}`);
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');

        // Check if file needs updating
        if (!content.includes('fetch("/api/') && !content.includes('fetch(`/api/') && !content.includes('href={`/api/')) {
            console.log(`Skipped (no API calls): ${filePath}`);
            return;
        }

        // Check if already updated
        if (content.includes('API_BASE_URL')) {
            console.log(`Skipped (already updated): ${filePath}`);
            return;
        }

        // Add import after last import statement
        const lines = content.split('\n');
        let lastImportIndex = -1;

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith('import ')) {
                lastImportIndex = i;
            }
        }

        if (lastImportIndex >= 0) {
            lines.splice(lastImportIndex + 1, 0, 'import { API_BASE_URL } from "../config";');
            content = lines.join('\n');
        }

        // Replace all API calls
        content = content.replace(/fetch\("\/api\//g, 'fetch(`${API_BASE_URL}/api/');
        content = content.replace(/fetch\(`\/api\//g, 'fetch(`${API_BASE_URL}/api/');
        content = content.replace(/href=\{`\/api\//g, 'href={`${API_BASE_URL}/api/');

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Updated: ${path.basename(filePath)}`);
    } catch (err) {
        console.error(`✗ Error updating ${filePath}:`, err.message);
    }
});

console.log('\nBatch update complete!');
