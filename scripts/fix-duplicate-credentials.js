// Script to remove duplicate credentials: 'include' properties

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('Removing Duplicate Credentials Properties');
console.log('==========================================\n');

// Find all .jsx files in frontend/src
const pattern = path.join(__dirname, '../frontend/src/**/*.jsx');
const files = glob.sync(pattern);

let totalFixed = 0;

files.forEach(file => {
    try {
        let content = fs.readFileSync(file, 'utf8');
        const originalContent = content;

        // Remove duplicate credentials on consecutive lines
        // Pattern: credentials: 'include', // comment\n          credentials: 'include', // comment
        content = content.replace(
            /(credentials:\s*'include',\s*\/\/[^\n]*\n\s*)credentials:\s*'include',\s*\/\/[^\n]*/g,
            '$1'
        );

        if (content !== originalContent) {
            fs.writeFileSync(file, content, 'utf8');
            const relativePath = path.relative(path.join(__dirname, '..'), file);
            console.log(`✓ Fixed: ${relativePath}`);
            totalFixed++;
        }
    } catch (error) {
        const relativePath = path.relative(path.join(__dirname, '..'), file);
        console.error(`✗ Error in ${relativePath}: ${error.message}`);
    }
});

console.log(`\nTotal files fixed: ${totalFixed}`);
