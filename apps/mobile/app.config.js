const path = require('path');
const { config } = require('dotenv');

// Load root monorepo .env so mobile uses the same env as admin
config({ path: path.resolve(__dirname, '../../.env') });

module.exports = require('./app.json');
