const request = require('supertest');
const app = require('../index');

describe('Pruebas de autenticación', () => {
    test('POST /api/registro debe crear usuario exitosamente', async () => {
        const emailUnico = `test_${Date.now()}_${Math.floor(Math.random() * 10000)}@correo.com`;

        const res = await request(app)
            .post('/api/registro')
            .send({
                nombre: 'Usuario Test',
                email: emailUnico,
                password: '123456',
                rol: 'consumidor',
                nombre_negocio: 'Negocio Test',
                direccion: 'Dirección Test',
                barrio: 'Barrio Test'
            });

        if (res.statusCode !== 200) {
            console.log('Error en registro:', res.text || res.body);
        }

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('mensaje');
    });
});