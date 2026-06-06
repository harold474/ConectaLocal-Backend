const request = require('supertest');
const app = require('../index');
const pool = require('../db');

afterAll(async () => {
    await pool.end();
});

test('GET /api/productos debe devolver 200 OK', async () => {
    const res = await request(app).get('/api/productos');

    expect(res.statusCode).toBe(200);
});

test('GET /test-db debe responder 200', async () => {
    const res = await request(app).get('/test-db');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('mensaje');
});