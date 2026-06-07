const pool = require('../db');

afterAll(async () => {
    await pool.end();
});