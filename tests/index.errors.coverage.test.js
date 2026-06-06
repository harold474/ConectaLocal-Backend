const request = require('supertest');

jest.mock('../middleware/validarToken', () => {
    return (req, res, next) => {
        req.usuario = {
            id: Number(req.headers['x-test-user-id']) || 1,
            rol: req.headers['x-test-role'] || 'consumidor'
        };
        next();
    };
});

jest.mock('bcrypt', () => ({
    genSalt: jest.fn().mockResolvedValue('salt'),
    hash: jest.fn().mockResolvedValue('hashed-password'),
    compare: jest.fn((password) => Promise.resolve(password === '123'))
}));

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(() => 'fake-jwt-token')
}));

const mockClient = {
    query: jest.fn(),
    release: jest.fn()
};

jest.mock('../db', () => ({
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn()
}));

const pool = require('../db');
const bcrypt = require('bcrypt');
const app = require('../index');

beforeEach(() => {
    jest.clearAllMocks();

    pool.connect.mockResolvedValue(mockClient);

    mockClient.query.mockResolvedValue({
        rows: [],
        rowCount: 0
    });

    pool.query.mockResolvedValue({
        rows: [],
        rowCount: 0
    });
});

describe('Cobertura adicional de errores y ramas faltantes', () => {
    test('GET /test-db responde 500 si falla la base de datos', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error BD'));

        const res = await request(app).get('/test-db');

        expect(res.statusCode).toBe(500);
        expect(res.text).toBe('Error de base de datos');
    });

    test('POST /api/registro responde 500 si falla la base de datos', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error registro'));

        const res = await request(app)
            .post('/api/registro')
            .send({
                nombre: 'Error Test',
                email: 'error@test.com',
                password: '123',
                rol: 'consumidor'
            });

        expect(res.statusCode).toBe(500);
        expect(res.text).toBe('Error al registrar');
    });

    test('POST /api/login responde 401 si la contraseña es incorrecta', async () => {
        pool.query.mockResolvedValueOnce({
            rows: [
                {
                    id: 1,
                    nombre: 'Usuario Test',
                    email: 'login@test.com',
                    password: 'hashed-password',
                    rol: 'consumidor',
                    estado: 'activo'
                }
            ],
            rowCount: 1
        });

        bcrypt.compare.mockResolvedValueOnce(false);

        const res = await request(app)
            .post('/api/login')
            .send({
                email: 'login@test.com',
                password: 'incorrecta'
            });

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('error');
    });

    test('POST /api/login responde 500 si ocurre error interno', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error login'));

        const res = await request(app)
            .post('/api/login')
            .send({
                email: 'error@test.com',
                password: '123'
            });

        expect(res.statusCode).toBe(500);
        expect(res.text).toBe('Error en login');
    });

    test('GET /api/productos responde 500 si falla la consulta', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error productos'));

        const res = await request(app).get('/api/productos');

        expect(res.statusCode).toBe(500);
        expect(res.text).toBe('Error al obtener productos');
    });

    test('POST /api/productos responde 500 si productor intenta crear y falla BD', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error crear producto'));

        const res = await request(app)
            .post('/api/productos')
            .set('x-test-role', 'productor')
            .field('nombre', 'Producto Error')
            .field('descripcion', 'Descripción')
            .field('precio', '1000')
            .field('categoria', 'Categoría')
            .field('stock', '5');

        expect(res.statusCode).toBe(500);
        expect(res.text).toBe('Error al crear producto');
    });

    test('GET /api/mis-productos responde 500 si falla la consulta', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error inventario'));

        const res = await request(app)
            .get('/api/mis-productos')
            .set('x-test-role', 'productor');

        expect(res.statusCode).toBe(500);
        expect(res.text).toBe('Error al obtener inventario');
    });

    test('PUT /api/productos/:id/gestion responde 500 si falla actualización', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error actualizar'));

        const res = await request(app)
            .put('/api/productos/1/gestion')
            .set('x-test-role', 'productor')
            .send({
                stock: 10,
                precio: 5000
            });

        expect(res.statusCode).toBe(500);
        expect(res.text).toBe('Error al actualizar');
    });

    test('DELETE /api/productos/:id responde 500 si falla eliminación', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error eliminar'));

        const res = await request(app)
            .delete('/api/productos/1')
            .set('x-test-role', 'productor');

        expect(res.statusCode).toBe(500);
        expect(res.text).toBe('Error al eliminar');
    });

    test('POST /api/pedidos responde 400 si no hay stock suficiente', async () => {
        mockClient.query.mockImplementation(async (sql) => {
            const query = sql.toString();

            if (query.includes('BEGIN')) return {};
            if (query.includes('ROLLBACK')) return {};
            if (query.includes('INSERT INTO pedidos')) {
                return {
                    rows: [{ id: 1 }],
                    rowCount: 1
                };
            }
            if (query.includes('SELECT stock FROM productos')) {
                return {
                    rows: [{ stock: 1 }],
                    rowCount: 1
                };
            }

            return {
                rows: [],
                rowCount: 0
            };
        });

        const res = await request(app)
            .post('/api/pedidos')
            .set('x-test-role', 'consumidor')
            .send({
                total: 20000,
                tipo_entrega: 'domicilio',
                direccion: 'Calle Test',
                barrio: 'Centro',
                telefono: '3000000000',
                carrito: [
                    {
                        id: 1,
                        nombre: 'Producto sin stock',
                        cantidad: 5,
                        precio: 4000
                    }
                ]
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('Stock insuficiente');
    });

    test('GET /api/mis-pedidos responde 500 si falla la consulta', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error historial'));

        const res = await request(app)
            .get('/api/mis-pedidos')
            .set('x-test-role', 'consumidor');

        expect(res.statusCode).toBe(500);
        expect(res.text).toBe('Error al obtener historial');
    });

    test('POST /api/pedidos/:id/cancelar responde 400 si pedido no existe', async () => {
        mockClient.query.mockImplementation(async (sql) => {
            const query = sql.toString();

            if (query.includes('BEGIN')) return {};
            if (query.includes('ROLLBACK')) return {};
            if (query.includes('SELECT fecha_pedido, estado FROM pedidos')) {
                return {
                    rows: [],
                    rowCount: 0
                };
            }

            return {
                rows: [],
                rowCount: 0
            };
        });

        const res = await request(app)
            .post('/api/pedidos/999/cancelar')
            .set('x-test-role', 'consumidor');

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('Pedido no encontrado');
    });

    test('POST /api/pedidos/:id/cancelar responde 400 si plazo está vencido', async () => {
        const fechaAntigua = new Date(Date.now() - 30 * 60 * 1000);

        mockClient.query.mockImplementation(async (sql) => {
            const query = sql.toString();

            if (query.includes('BEGIN')) return {};
            if (query.includes('ROLLBACK')) return {};
            if (query.includes('SELECT fecha_pedido, estado FROM pedidos')) {
                return {
                    rows: [
                        {
                            fecha_pedido: fechaAntigua,
                            estado: 'pendiente'
                        }
                    ],
                    rowCount: 1
                };
            }

            return {
                rows: [],
                rowCount: 0
            };
        });

        const res = await request(app)
            .post('/api/pedidos/1/cancelar')
            .set('x-test-role', 'consumidor');

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('Plazo vencido');
    });

    test('GET /api/mis-ventas responde 500 si falla consulta', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error ventas'));

        const res = await request(app)
            .get('/api/mis-ventas')
            .set('x-test-role', 'productor');

        expect(res.statusCode).toBe(500);
        expect(res.text).toBe('Error al obtener ventas');
    });

    test('PUT /api/pedidos/:id/estado responde 500 si falla actualización', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error estado'));

        const res = await request(app)
            .put('/api/pedidos/1/estado')
            .set('x-test-role', 'productor')
            .send({
                estado: 'entregado'
            });

        expect(res.statusCode).toBe(500);
        expect(res.text).toBe('Error al actualizar');
    });

    test('GET /api/perfil responde 500 si falla consulta', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error perfil'));

        const res = await request(app)
            .get('/api/perfil')
            .set('x-test-role', 'consumidor');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error');
    });

    test('PUT /api/perfil responde 500 si falla actualización', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error actualizar perfil'));

        const res = await request(app)
            .put('/api/perfil')
            .set('x-test-role', 'consumidor')
            .send({
                nombre: 'Harold',
                apellidos: 'Test',
                direccion: 'Calle 1',
                barrio: 'Centro',
                ciudad: 'Bogotá',
                telefono: '3000000000',
                preferencias: 'Orgánico'
            });

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error');
    });

    test('PUT /api/perfil/foto responde 500 si falla actualización con archivo', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error foto'));

        const res = await request(app)
            .put('/api/perfil/foto')
            .set('x-test-role', 'consumidor')
            .attach('foto', Buffer.from('fake-image'), 'foto-error.png');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error');
    });

    test('GET /api/admin/productos rechaza usuario no admin', async () => {
        const res = await request(app)
            .get('/api/admin/productos')
            .set('x-test-role', 'consumidor');

        expect(res.statusCode).toBe(403);
    });

    test('DELETE /api/admin/productos/:id rechaza usuario no admin', async () => {
        const res = await request(app)
            .delete('/api/admin/productos/1')
            .set('x-test-role', 'consumidor');

        expect(res.statusCode).toBe(403);
    });

    test('GET /api/admin/pedidos rechaza usuario no admin', async () => {
        const res = await request(app)
            .get('/api/admin/pedidos')
            .set('x-test-role', 'consumidor');

        expect(res.statusCode).toBe(403);
    });

    test('GET /api/admin/usuarios responde 500 si falla consulta', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error admin usuarios'));

        const res = await request(app)
            .get('/api/admin/usuarios')
            .set('x-test-role', 'admin');

        expect(res.statusCode).toBe(500);
        expect(res.text).toBe('Error al obtener la lista de usuarios');
    });

    test('PUT /api/admin/usuarios/:id/estado responde 403 si no es admin', async () => {
        const res = await request(app)
            .put('/api/admin/usuarios/1/estado')
            .set('x-test-role', 'consumidor')
            .send({
                estado: 'activo'
            });

        expect(res.statusCode).toBe(403);
    });

    test('PUT /api/admin/usuarios/:id/estado responde 500 si falla actualización', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error estado usuario'));

        const res = await request(app)
            .put('/api/admin/usuarios/1/estado')
            .set('x-test-role', 'admin')
            .send({
                estado: 'activo'
            });

        expect(res.statusCode).toBe(500);
        expect(res.text).toBe('Error al actualizar el estado del usuario');
    });

    test('GET /api/admin/productos responde 500 si falla consulta', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error admin productos'));

        const res = await request(app)
            .get('/api/admin/productos')
            .set('x-test-role', 'admin');

        expect(res.statusCode).toBe(500);
        expect(res.text).toBe('Error al obtener publicaciones');
    });

    test('DELETE /api/admin/productos/:id responde 500 si falla eliminación admin', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error eliminar admin'));

        const res = await request(app)
            .delete('/api/admin/productos/1')
            .set('x-test-role', 'admin');

        expect(res.statusCode).toBe(500);
        expect(res.text).toBe('Error al eliminar el producto');
    });

    test('GET /api/admin/pedidos responde 500 si falla consulta', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error admin pedidos'));

        const res = await request(app)
            .get('/api/admin/pedidos')
            .set('x-test-role', 'admin');

        expect(res.statusCode).toBe(500);
        expect(res.text).toBe('Error al obtener las transacciones');
    });

    test('GET /api/productos/:id/preguntas responde 500 si falla consulta', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error preguntas'));

        const res = await request(app).get('/api/productos/1/preguntas');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error');
    });

    test('POST /api/productos/:id/preguntas responde 500 si falla inserción', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error pregunta'));

        const res = await request(app)
            .post('/api/productos/1/preguntas')
            .set('x-test-role', 'consumidor')
            .send({
                pregunta: '¿Disponible?'
            });

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error');
    });

    test('PUT /api/preguntas/:id/responder responde 404 si pregunta no existe o no tiene permiso', async () => {
        pool.query.mockResolvedValueOnce({
            rows: [],
            rowCount: 0
        });

        const res = await request(app)
            .put('/api/preguntas/999/responder')
            .set('x-test-role', 'productor')
            .send({
                respuesta: 'Respuesta válida'
            });

        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('error');
    });

    test('PUT /api/preguntas/:id/responder responde 500 si falla actualización', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error responder'));

        const res = await request(app)
            .put('/api/preguntas/1/responder')
            .set('x-test-role', 'productor')
            .send({
                respuesta: 'Respuesta válida'
            });

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error');
    });

    test('GET /api/pedidos/:id/mensajes responde 500 si falla consulta', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error mensajes'));

        const res = await request(app)
            .get('/api/pedidos/1/mensajes')
            .set('x-test-role', 'consumidor');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error');
    });

    test('POST /api/pedidos/:id/mensajes responde 500 si falla inserción', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error enviar mensaje'));

        const res = await request(app)
            .post('/api/pedidos/1/mensajes')
            .set('x-test-role', 'consumidor')
            .send({
                mensaje: 'Hola'
            });

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error');
    });

    test('POST /api/contacto responde 500 si falla inserción', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error contacto'));

        const res = await request(app)
            .post('/api/contacto')
            .send({
                nombre: 'Harold',
                email: 'harold@test.com',
                asunto: 'Soporte',
                mensaje: 'Necesito ayuda'
            });

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error');
    });

    test('PUT /api/admin/promover responde 500 si falla actualización', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error promover'));

        const res = await request(app)
            .put('/api/admin/promover')
            .set('x-test-role', 'admin')
            .send({
                email: 'user@test.com'
            });

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error');
    });
});