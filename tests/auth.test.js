const request = require('supertest');
const app = require('../index');
const pool = require('../db');

afterAll(async () => {
    await pool.end();
});

test('POST /api/registro debe crear usuario exitosamente', async () => {
    const res = await request(app)
        .post('/api/registro')
        .send({
            nombre: 'Harold Test',
            email: 'test' + Date.now() + '@test.com',
            password: '123',
            rol: 'consumidor',
            nombre_negocio: null,
            direccion: 'Calle Falsa 123',
            barrio: 'Centro'
        });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('mensaje');
});