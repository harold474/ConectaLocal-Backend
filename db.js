const { Pool } = require('pg');
require('dotenv').config({ quiet: true });

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,

    // Ayuda a que Jest cierre correctamente
    allowExitOnIdle: true
});

module.exports = pool;