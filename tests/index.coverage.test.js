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
const app = require('../index');

beforeEach(() => {
    jest.clearAllMocks();

    mockClient.query.mockImplementation(async (sql, params) => {
        const query = sql.toString();

        if (query.includes('BEGIN')) {
            return {};
        }

        if (query.includes('COMMIT')) {
            return {};
        }

        if (query.includes('ROLLBACK')) {
            return {};
        }

        if (query.includes('INSERT INTO pedidos')) {
            return { rows: [{ id: 10 }], rowCount: 1 };
        }

        if (query.includes('SELECT stock FROM productos')) {
            return { rows: [{ stock: 100 }], rowCount: 1 };
        }

        if (query.includes('UPDATE productos SET stock = stock -')) {
            return { rows: [], rowCount: 1 };
        }

        if (query.includes('INSERT INTO detalle_pedidos')) {
            return { rows: [], rowCount: 1 };
        }

        if (query.includes('SELECT fecha_pedido, estado FROM pedidos')) {
            return {
                rows: [
                    {
                        fecha_pedido: new Date(),
                        estado: 'pendiente'
                    }
                ],
                rowCount: 1
            };
        }

        if (query.includes('SELECT producto_id, cantidad FROM detalle_pedidos')) {
            return {
                rows: [
                    {
                        producto_id: 1,
                        cantidad: 2
                    }
                ],
                rowCount: 1
            };
        }

        if (query.includes('UPDATE productos SET stock = stock +')) {
            return { rows: [], rowCount: 1 };
        }

        if (query.includes("UPDATE pedidos SET estado = 'cancelado'")) {
            return { rows: [], rowCount: 1 };
        }

        return { rows: [], rowCount: 0 };
    });

    pool.connect.mockResolvedValue(mockClient);

    pool.query.mockImplementation(async (sql, params) => {
        const query = sql.toString();

        if (query.includes('SELECT NOW()')) {
            return {
                rows: [{ now: new Date() }],
                rowCount: 1
            };
        }

        if (query.includes('SELECT * FROM usuarios WHERE email = $1')) {
            const email = params[0];

            if (email === 'activo@test.com') {
                return {
                    rows: [
                        {
                            id: 1,
                            nombre: 'Activo',
                            email,
                            password: 'hashed-password',
                            rol: 'consumidor',
                            estado: 'activo'
                        }
                    ],
                    rowCount: 1
                };
            }

            if (email === 'inactivo@test.com') {
                return {
                    rows: [
                        {
                            id: 2,
                            nombre: 'Inactivo',
                            email,
                            password: 'hashed-password',
                            rol: 'consumidor',
                            estado: 'inactivo'
                        }
                    ],
                    rowCount: 1
                };
            }

            if (email === 'bloqueado@test.com') {
                return {
                    rows: [
                        {
                            id: 3,
                            nombre: 'Bloqueado',
                            email,
                            password: 'hashed-password',
                            rol: 'consumidor',
                            estado: 'bloqueado'
                        }
                    ],
                    rowCount: 1
                };
            }

            if (email === 'login@test.com') {
                return {
                    rows: [
                        {
                            id: 4,
                            nombre: 'Login User',
                            email,
                            password: 'hashed-password',
                            rol: 'consumidor',
                            estado: 'activo'
                        }
                    ],
                    rowCount: 1
                };
            }

            return {
                rows: [],
                rowCount: 0
            };
        }

        if (query.includes('INSERT INTO usuarios')) {
            return {
                rows: [
                    {
                        id: 99,
                        nombre: params[0],
                        email: params[1],
                        rol: params[3],
                        estado: 'activo'
                    }
                ],
                rowCount: 1
            };
        }

        if (query.includes('UPDATE usuarios') && query.includes("SET estado = 'activo'")) {
            return {
                rows: [
                    {
                        id: 2,
                        nombre: params[0],
                        email: params[6],
                        rol: params[2],
                        estado: 'activo'
                    }
                ],
                rowCount: 1
            };
        }

        if (query.includes('FROM productos p') && query.includes('WHERE p.stock > 0')) {
            return {
                rows: [
                    {
                        id: 1,
                        nombre: 'Papa criolla',
                        precio: 5000,
                        stock: 10,
                        nombre_productor: 'Productor Test'
                    }
                ],
                rowCount: 1
            };
        }

        if (query.includes('INSERT INTO productos')) {
            return {
                rows: [
                    {
                        id: 1,
                        nombre: params[0],
                        descripcion: params[1],
                        precio: params[2],
                        categoria: params[3],
                        imagenes: params[4],
                        productor_id: params[5],
                        stock: params[6]
                    }
                ],
                rowCount: 1
            };
        }

        if (query.includes('FROM productos p') && query.includes('LEFT JOIN preguntas_respuestas')) {
            return {
                rows: [
                    {
                        id: 1,
                        nombre: 'Producto propio',
                        preguntas_pendientes: 1
                    }
                ],
                rowCount: 1
            };
        }

        if (query.includes('UPDATE productos SET stock = $1, precio = $2')) {
            return {
                rows: [
                    {
                        id: params[2],
                        stock: params[0],
                        precio: params[1]
                    }
                ],
                rowCount: 1
            };
        }

        if (query.includes('DELETE FROM productos WHERE id = $1 AND productor_id = $2')) {
            return {
                rows: [],
                rowCount: 1
            };
        }

        if (query.includes('FROM pedidos p') && query.includes('WHERE p.consumidor_id = $1')) {
            return {
                rows: [
                    {
                        id: 1,
                        estado: 'pendiente',
                        total: 10000,
                        productos: []
                    }
                ],
                rowCount: 1
            };
        }

        if (query.includes('FROM pedidos p') && query.includes('WHERE pr.productor_id = $1')) {
            return {
                rows: [
                    {
                        pedido_id: 1,
                        estado: 'pendiente',
                        total: 10000,
                        cliente: 'Cliente Test',
                        productos: []
                    }
                ],
                rowCount: 1
            };
        }

        if (query.includes('UPDATE pedidos SET estado = $1 WHERE id = $2')) {
            return {
                rows: [],
                rowCount: 1
            };
        }

        if (query.includes('SELECT id, nombre, apellidos, email, rol')) {
            return {
                rows: [
                    {
                        id: 1,
                        nombre: 'Harold',
                        email: 'harold@test.com',
                        rol: 'consumidor',
                        estado: 'activo'
                    }
                ],
                rowCount: 1
            };
        }

        if (query.includes('UPDATE usuarios') && query.includes('SET foto_perfil')) {
            return {
                rows: [],
                rowCount: 1
            };
        }

        if (query.includes('UPDATE usuarios') && query.includes('SET nombre = $1')) {
            return {
                rows: [],
                rowCount: 1
            };
        }

        if (query.includes('SELECT id, nombre, email, rol, nombre_negocio, estado FROM usuarios')) {
            return {
                rows: [
                    {
                        id: 1,
                        nombre: 'Usuario Test',
                        email: 'user@test.com',
                        rol: 'consumidor',
                        estado: 'activo'
                    }
                ],
                rowCount: 1
            };
        }

        if (query.includes('UPDATE usuarios SET estado = $1 WHERE id = $2')) {
            if (params[1] === '999') {
                return {
                    rows: [],
                    rowCount: 0
                };
            }

            return {
                rows: [
                    {
                        id: params[1],
                        nombre: 'Usuario Estado',
                        email: 'estado@test.com',
                        estado: params[0]
                    }
                ],
                rowCount: 1
            };
        }

        if (query.includes('SELECT p.id, p.nombre, p.descripcion')) {
            return {
                rows: [
                    {
                        id: 1,
                        nombre: 'Producto Admin',
                        precio: 5000,
                        stock: 10,
                        productor: 'Productor Test'
                    }
                ],
                rowCount: 1
            };
        }

        if (query.includes('DELETE FROM productos WHERE id = $1')) {
            return {
                rows: [],
                rowCount: 1
            };
        }

        if (query.includes('string_agg')) {
            return {
                rows: [
                    {
                        id: 1,
                        estado: 'pendiente',
                        total: 10000,
                        comprador: 'Comprador Test',
                        vendedores: 'Vendedor Test'
                    }
                ],
                rowCount: 1
            };
        }

        if (query.includes('FROM preguntas_respuestas pr') && query.includes('JOIN usuarios u')) {
            return {
                rows: [
                    {
                        id: 1,
                        pregunta: '¿Está disponible?',
                        respuesta: null,
                        consumidor: 'Cliente Test'
                    }
                ],
                rowCount: 1
            };
        }

        if (query.includes('INSERT INTO preguntas_respuestas')) {
            return {
                rows: [
                    {
                        id: 1,
                        producto_id: params[0],
                        consumidor_id: params[1],
                        pregunta: params[2]
                    }
                ],
                rowCount: 1
            };
        }

        if (query.includes('UPDATE preguntas_respuestas pr')) {
            return {
                rows: [
                    {
                        id: params[1],
                        respuesta: params[0]
                    }
                ],
                rowCount: 1
            };
        }

        if (query.includes('FROM mensajes_pedido m')) {
            return {
                rows: [
                    {
                        id: 1,
                        mensaje: 'Hola',
                        remitente_id: 1,
                        remitente_nombre: 'Harold',
                        remitente_rol: 'consumidor'
                    }
                ],
                rowCount: 1
            };
        }

        if (query.includes('INSERT INTO mensajes_pedido')) {
            return {
                rows: [
                    {
                        id: 1,
                        pedido_id: params[0],
                        remitente_id: params[1],
                        mensaje: params[2]
                    }
                ],
                rowCount: 1
            };
        }

        if (query.includes('INSERT INTO contactos')) {
            return {
                rows: [],
                rowCount: 1
            };
        }

        if (query.includes('SELECT * FROM contactos')) {
            return {
                rows: [
                    {
                        id: 1,
                        nombre: 'Contacto Test',
                        email: 'contacto@test.com',
                        mensaje: 'Mensaje test'
                    }
                ],
                rowCount: 1
            };
        }

        if (query.includes("UPDATE usuarios SET rol = 'admin'")) {
            if (params[0] === 'noexiste@test.com') {
                return {
                    rows: [],
                    rowCount: 0
                };
            }

            return {
                rows: [
                    {
                        id: 1,
                        email: params[0],
                        rol: 'admin'
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
});

describe('Cobertura amplia de index.js', () => {
    test('GET /test-db debe responder conexión exitosa', async () => {
        const res = await request(app).get('/test-db');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('mensaje');
    });

    test('POST /api/registro crea usuario nuevo', async () => {
        const res = await request(app)
            .post('/api/registro')
            .send({
                nombre: 'Nuevo Usuario',
                email: 'nuevo@test.com',
                password: '123',
                rol: 'consumidor',
                nombre_negocio: null,
                direccion: 'Calle 1',
                barrio: 'Centro'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.mensaje).toBe('Usuario creado');
    });

    test('POST /api/registro rechaza usuario activo existente', async () => {
        const res = await request(app)
            .post('/api/registro')
            .send({
                nombre: 'Activo',
                email: 'activo@test.com',
                password: '123',
                rol: 'consumidor'
            });

        expect(res.statusCode).toBe(400);
    });

    test('POST /api/registro reactiva usuario inactivo', async () => {
        const res = await request(app)
            .post('/api/registro')
            .send({
                nombre: 'Inactivo Reactivado',
                email: 'inactivo@test.com',
                password: '123',
                rol: 'consumidor'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.mensaje).toContain('Cuenta reactivada');
    });

    test('POST /api/registro bloquea usuario bloqueado', async () => {
        const res = await request(app)
            .post('/api/registro')
            .send({
                nombre: 'Bloqueado',
                email: 'bloqueado@test.com',
                password: '123',
                rol: 'consumidor'
            });

        expect(res.statusCode).toBe(403);
    });

    test('POST /api/login exitoso', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({
                email: 'login@test.com',
                password: '123'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    test('POST /api/login credenciales incorrectas si usuario no existe', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({
                email: 'noexiste@test.com',
                password: '123'
            });

        expect(res.statusCode).toBe(401);
    });

    test('POST /api/login bloqueado', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({
                email: 'bloqueado@test.com',
                password: '123'
            });

        expect(res.statusCode).toBe(403);
    });

    test('POST /api/login inactivo', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({
                email: 'inactivo@test.com',
                password: '123'
            });

        expect(res.statusCode).toBe(403);
    });

    test('GET /api/productos lista productos', async () => {
        const res = await request(app).get('/api/productos');

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('POST /api/productos rechaza consumidor', async () => {
        const res = await request(app)
            .post('/api/productos')
            .set('x-test-role', 'consumidor')
            .field('nombre', 'Tomate')
            .field('descripcion', 'Fresco')
            .field('precio', '3000')
            .field('categoria', 'Verduras')
            .field('stock', '10');

        expect(res.statusCode).toBe(403);
    });

    test('POST /api/productos permite productor', async () => {
        const res = await request(app)
            .post('/api/productos')
            .set('x-test-role', 'productor')
            .field('nombre', 'Tomate')
            .field('descripcion', 'Fresco')
            .field('precio', '3000')
            .field('categoria', 'Verduras')
            .field('stock', '10');

        expect(res.statusCode).toBe(200);
    });

    test('GET /api/mis-productos rechaza no productor', async () => {
        const res = await request(app)
            .get('/api/mis-productos')
            .set('x-test-role', 'consumidor');

        expect(res.statusCode).toBe(403);
    });

    test('GET /api/mis-productos permite productor', async () => {
        const res = await request(app)
            .get('/api/mis-productos')
            .set('x-test-role', 'productor');

        expect(res.statusCode).toBe(200);
    });

    test('PUT /api/productos/:id/gestion actualiza producto', async () => {
        const res = await request(app)
            .put('/api/productos/1/gestion')
            .set('x-test-role', 'productor')
            .send({
                stock: 20,
                precio: 4000
            });

        expect(res.statusCode).toBe(200);
    });

    test('DELETE /api/productos/:id elimina producto', async () => {
        const res = await request(app)
            .delete('/api/productos/1')
            .set('x-test-role', 'productor');

        expect(res.statusCode).toBe(200);
    });

    test('POST /api/pedidos rechaza productor', async () => {
        const res = await request(app)
            .post('/api/pedidos')
            .set('x-test-role', 'productor')
            .send({});

        expect(res.statusCode).toBe(403);
    });

    test('POST /api/pedidos crea pedido', async () => {
        const res = await request(app)
            .post('/api/pedidos')
            .set('x-test-role', 'consumidor')
            .send({
                total: 10000,
                tipo_entrega: 'domicilio',
                direccion: 'Calle 1',
                barrio: 'Centro',
                telefono: '3000000000',
                carrito: [
                    {
                        id: 1,
                        nombre: 'Tomate',
                        cantidad: 2,
                        precio: 5000
                    }
                ]
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('pedido_id');
    });

    test('GET /api/mis-pedidos lista historial consumidor', async () => {
        const res = await request(app)
            .get('/api/mis-pedidos')
            .set('x-test-role', 'consumidor');

        expect(res.statusCode).toBe(200);
    });

    test('POST /api/pedidos/:id/cancelar cancela pedido', async () => {
        const res = await request(app)
            .post('/api/pedidos/1/cancelar')
            .set('x-test-role', 'consumidor');

        expect(res.statusCode).toBe(200);
    });

    test('GET /api/mis-ventas rechaza consumidor', async () => {
        const res = await request(app)
            .get('/api/mis-ventas')
            .set('x-test-role', 'consumidor');

        expect(res.statusCode).toBe(403);
    });

    test('GET /api/mis-ventas permite productor', async () => {
        const res = await request(app)
            .get('/api/mis-ventas')
            .set('x-test-role', 'productor');

        expect(res.statusCode).toBe(200);
    });

    test('PUT /api/pedidos/:id/estado actualiza estado', async () => {
        const res = await request(app)
            .put('/api/pedidos/1/estado')
            .set('x-test-role', 'productor')
            .send({
                estado: 'enviado'
            });

        expect(res.statusCode).toBe(200);
    });

    test('GET /api/perfil obtiene perfil', async () => {
        const res = await request(app)
            .get('/api/perfil')
            .set('x-test-role', 'consumidor');

        expect(res.statusCode).toBe(200);
    });

    test('PUT /api/perfil actualiza perfil', async () => {
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

        expect(res.statusCode).toBe(200);
    });

    test('PUT /api/perfil/foto sin archivo responde 400', async () => {
        const res = await request(app)
            .put('/api/perfil/foto')
            .set('x-test-role', 'consumidor');

        expect(res.statusCode).toBe(400);
    });

    test('PUT /api/perfil/foto actualiza foto', async () => {
        const res = await request(app)
            .put('/api/perfil/foto')
            .set('x-test-role', 'consumidor')
            .attach('foto', Buffer.from('fake-image'), 'foto.png');

        expect(res.statusCode).toBe(200);
    });

    test('GET /api/admin/usuarios rechaza consumidor', async () => {
        const res = await request(app)
            .get('/api/admin/usuarios')
            .set('x-test-role', 'consumidor');

        expect(res.statusCode).toBe(403);
    });

    test('GET /api/admin/usuarios permite admin', async () => {
        const res = await request(app)
            .get('/api/admin/usuarios')
            .set('x-test-role', 'admin');

        expect(res.statusCode).toBe(200);
    });

    test('PUT /api/admin/usuarios/:id/estado rechaza estado inválido', async () => {
        const res = await request(app)
            .put('/api/admin/usuarios/1/estado')
            .set('x-test-role', 'admin')
            .send({
                estado: 'desconocido'
            });

        expect(res.statusCode).toBe(400);
    });

    test('PUT /api/admin/usuarios/:id/estado actualiza estado', async () => {
        const res = await request(app)
            .put('/api/admin/usuarios/1/estado')
            .set('x-test-role', 'admin')
            .send({
                estado: 'activo'
            });

        expect(res.statusCode).toBe(200);
    });

    test('PUT /api/admin/usuarios/:id/estado usuario no encontrado', async () => {
        const res = await request(app)
            .put('/api/admin/usuarios/999/estado')
            .set('x-test-role', 'admin')
            .send({
                estado: 'activo'
            });

        expect(res.statusCode).toBe(404);
    });

    test('GET /api/admin/productos lista publicaciones', async () => {
        const res = await request(app)
            .get('/api/admin/productos')
            .set('x-test-role', 'admin');

        expect(res.statusCode).toBe(200);
    });

    test('DELETE /api/admin/productos/:id elimina publicación', async () => {
        const res = await request(app)
            .delete('/api/admin/productos/1')
            .set('x-test-role', 'admin');

        expect(res.statusCode).toBe(200);
    });

    test('GET /api/admin/pedidos lista transacciones', async () => {
        const res = await request(app)
            .get('/api/admin/pedidos')
            .set('x-test-role', 'admin');

        expect(res.statusCode).toBe(200);
    });

    test('GET /api/productos/:id/preguntas lista preguntas', async () => {
        const res = await request(app)
            .get('/api/productos/1/preguntas');

        expect(res.statusCode).toBe(200);
    });

    test('POST /api/productos/:id/preguntas rechaza productor', async () => {
        const res = await request(app)
            .post('/api/productos/1/preguntas')
            .set('x-test-role', 'productor')
            .send({
                pregunta: '¿Disponible?'
            });

        expect(res.statusCode).toBe(403);
    });

    test('POST /api/productos/:id/preguntas permite consumidor', async () => {
        const res = await request(app)
            .post('/api/productos/1/preguntas')
            .set('x-test-role', 'consumidor')
            .send({
                pregunta: '¿Disponible?'
            });

        expect(res.statusCode).toBe(200);
    });

    test('PUT /api/preguntas/:id/responder rechaza consumidor', async () => {
        const res = await request(app)
            .put('/api/preguntas/1/responder')
            .set('x-test-role', 'consumidor')
            .send({
                respuesta: 'Sí'
            });

        expect(res.statusCode).toBe(403);
    });

    test('PUT /api/preguntas/:id/responder rechaza respuesta vacía', async () => {
        const res = await request(app)
            .put('/api/preguntas/1/responder')
            .set('x-test-role', 'productor')
            .send({
                respuesta: ''
            });

        expect(res.statusCode).toBe(400);
    });

    test('PUT /api/preguntas/:id/responder permite productor', async () => {
        const res = await request(app)
            .put('/api/preguntas/1/responder')
            .set('x-test-role', 'productor')
            .send({
                respuesta: 'Sí está disponible'
            });

        expect(res.statusCode).toBe(200);
    });

    test('GET /api/pedidos/:id/mensajes obtiene mensajes', async () => {
        const res = await request(app)
            .get('/api/pedidos/1/mensajes')
            .set('x-test-role', 'consumidor');

        expect(res.statusCode).toBe(200);
    });

    test('POST /api/pedidos/:id/mensajes envía mensaje', async () => {
        const res = await request(app)
            .post('/api/pedidos/1/mensajes')
            .set('x-test-role', 'consumidor')
            .send({
                mensaje: 'Hola productor'
            });

        expect(res.statusCode).toBe(200);
    });

    test('POST /api/contacto crea mensaje contacto', async () => {
        const res = await request(app)
            .post('/api/contacto')
            .send({
                nombre: 'Harold',
                email: 'harold@test.com',
                asunto: 'Ayuda',
                mensaje: 'Necesito soporte'
            });

        expect(res.statusCode).toBe(200);
    });

    test('GET /api/admin/contactos rechaza no admin', async () => {
        const res = await request(app)
            .get('/api/admin/contactos')
            .set('x-test-role', 'consumidor');

        expect(res.statusCode).toBe(403);
    });

    test('GET /api/admin/contactos permite admin', async () => {
        const res = await request(app)
            .get('/api/admin/contactos')
            .set('x-test-role', 'admin');

        expect(res.statusCode).toBe(200);
    });

    test('PUT /api/admin/promover rechaza no admin', async () => {
        const res = await request(app)
            .put('/api/admin/promover')
            .set('x-test-role', 'consumidor')
            .send({
                email: 'user@test.com'
            });

        expect(res.statusCode).toBe(403);
    });

    test('PUT /api/admin/promover permite admin', async () => {
        const res = await request(app)
            .put('/api/admin/promover')
            .set('x-test-role', 'admin')
            .send({
                email: 'user@test.com'
            });

        expect(res.statusCode).toBe(200);
    });

    test('PUT /api/admin/promover usuario no encontrado', async () => {
        const res = await request(app)
            .put('/api/admin/promover')
            .set('x-test-role', 'admin')
            .send({
                email: 'noexiste@test.com'
            });

        expect(res.statusCode).toBe(404);
    });
});