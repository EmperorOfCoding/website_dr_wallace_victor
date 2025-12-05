// Script to fix all fetch calls to use credentials: 'include' instead of Authorization header

const fs = require('fs');
const path = require('path');

const filesToFix = [
    'AdminAgenda.jsx',
    'AdminCalendar.jsx',
    'AdminPatients.jsx',
    'AdminPatientDetails.jsx',
    'AdminMetrics.jsx',
    'Agendar.jsx',
    'AppointmentDetails.jsx',
    'Dashboard.jsx',
    'DocumentUpload.jsx',
    'DoctorProfile.jsx',
    'MinhaAgenda.jsx',
    'PatientExams.jsx',
    'ReviewAppointment.jsx',
];

const componentFiles = ['ExamPanel.jsx'];

console.log('Fix Authentication Headers - Replace Bearer Token with Credentials');
console.log('==================================================================\n');

// Page files
filesToFix.forEach(file => {
    const filePath = path.join(__dirname, '../frontend/src/pages', file);
    console.log(`Processing: ${file}`);

    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Remove const { token } = useAuth();
        const tokenRegex = /const \{ token \} = useAuth\(\);?\r?\n/g;
        if (content.match(tokenRegex)) {
            content = content.replace(tokenRegex, '');
            modified = true;
            console.log(`  - Removed token destructuring`);
        }

        // Replace Authorization headers with credentials
        const authHeaderRegex = /headers:\s*\{?\s*Authorization:\s*`Bearer \$\{token\}`\s*\}?,?/g;
        if (content.match(authHeaderRegex)) {
            content = content.replace(authHeaderRegex, "credentials: 'include', // Send cookies");
            modified = true;
            console.log(`  - Replaced Authorization header with credentials`);
        }

        // Replace conditional Authorization headers
        const conditionalAuthRegex = /headers:\s*token\s*\?\s*\{\s*Authorization:\s*`Bearer \$\{token\}`\s*\}\s*:\s*undefined,?/g;
        if (content.match(conditionalAuthRegex)) {
            content = content.replace(conditionalAuthRegex, "credentials: 'include', // Send cookies");
            modified = true;
            console.log(`  - Replaced conditional Authorization header with credentials`);
        }

        // Replace spread Authorization headers
        const spreadAuthRegex = /\.\.\.\(token\s*\?\s*\{\s*Authorization:\s*`Bearer \$\{token\}`\s*\}\s*:\s*\{\}\),?/g;
        if (content.match(spreadAuthRegex)) {
            content = content.replace(spreadAuthRegex, "");
            modified = true;
            console.log(`  - Removed spread Authorization header`);

            // Add credentials if not present
            if (!content.includes("credentials: 'include'")) {
                // This is tricky, we'll need to manually add it
                console.log(`  ! WARNING: Manual intervention needed to add credentials`);
            }
        }

        // Remove token from useEffect dependencies
        const useEffectRegex = /\},\s*\[token,\s*/g;
        if (content.match(useEffectRegex)) {
            content = content.replace(useEffectRegex, '}, [');
            modified = true;
            console.log(`  - Removed token from useEffect dependencies`);
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`  ✓ File updated successfully\n`);
        } else {
            console.log(`  - No changes needed\n`);
        }
    } catch (error) {
        console.error(`  ✗ Error: ${error.message}\n`);
    }
});

// Component files
componentFiles.forEach(file => {
    const filePath = path.join(__dirname, '../frontend/src/components', file);
    console.log(`Processing: components/${file}`);

    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Same replacements as above
        const tokenRegex = /const \{ token \} = useAuth\(\);?\r?\n/g;
        if (content.match(tokenRegex)) {
            content = content.replace(tokenRegex, '');
            modified = true;
            console.log(`  - Removed token destructuring`);
        }

        const authHeaderRegex = /headers:\s*\{?\s*Authorization:\s*`Bearer \$\{token\}`\s*\}?,?/g;
        if (content.match(authHeaderRegex)) {
            content = content.replace(authHeaderRegex, "credentials: 'include', // Send cookies");
            modified = true;
            console.log(`  - Replaced Authorization header with credentials`);
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`  ✓ File updated successfully\n`);
        } else {
            console.log(`  - No changes needed\n`);
        }
    } catch (error) {
        console.error(`  ✗ Error: ${error.message}\n`);
    }
});

console.log('Done!');
