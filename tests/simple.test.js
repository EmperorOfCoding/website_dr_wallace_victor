const fs = require('fs');
const path = require('path');

describe('Simple Test', () => {
    it('should load app', () => {
        try {
            const app = require('../src/app');
            expect(app).toBeDefined();
        } catch (error) {
            fs.writeFileSync(path.join(__dirname, 'import_error.txt'), error.stack || error.message);
            throw error;
        }
    });
});
