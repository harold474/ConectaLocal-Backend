const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config({ quiet: true });

const pool = require('./db');
const { calcularTotal } = require('./logic');

// Importamos el guardia de seguridad
const validarToken = require('./middleware/validarToken');

const app = express();

// ==========================================
// CONFIGURACIÓN DE SWAGGER
// ==========================================
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'ConectaLocal API',
            version: '1.0.0',
            description: 'Documentación técnica de la API REST del sistema ConectaLocal'
        },
        servers: [
            {
                url: 'https://conectalocal-backend.onrender.com',
                description: 'Servidor de producción en Render'
            },
            {
                url: 'http://localhost:3000',
                description: 'Servidor local de desarrollo'
            }
        ],
        paths: {
            '/': {
                get: {
                    summary: 'Estado general de la API',
                    description: 'Retorna un mensaje indicando que la API de ConectaLocal está funcionando correctamente.',
                    responses: {
                        200: {
                            description: 'API funcionando correctamente.'
                        }
                    }
                }
            },
            '/test-db': {
                get: {
                    summary: 'Probar conexión con la base de datos',
                    description: 'Verifica que el backend pueda conectarse correctamente con PostgreSQL.',
                    responses: {
                        200: {
                            description: 'Conexión exitosa con la base de datos.'
                        },
                        500: {
                            description: 'Error de conexión con la base de datos.'
                        }
                    }
                }
            },
            '/api/registro': {
                post: {
                    summary: 'Registrar usuario',
                    description: 'Crea un nuevo usuario en el sistema o reactiva una cuenta inactiva.',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        nombre: {
                                            type: 'string',
                                            example: 'Usuario Test'
                                        },
                                        email: {
                                            type: 'string',
                                            example: 'usuario@correo.com'
                                        },
                                        password: {
                                            type: 'string',
                                            example: '123456'
                                        },
                                        rol: {
                                            type: 'string',
                                            example: 'consumidor'
                                        },
                                        nombre_negocio: {
                                            type: 'string',
                                            example: 'Negocio Local'
                                        },
                                        direccion: {
                                            type: 'string',
                                            example: 'Calle 123'
                                        },
                                        barrio: {
                                            type: 'string',
                                            example: 'Centro'
                                        }
                                    },
                                    required: ['nombre', 'email', 'password']
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Usuario creado o reactivado correctamente.'
                        },
                        400: {
                            description: 'Usuario ya registrado o datos inválidos.'
                        },
                        403: {
                            description: 'Usuario bloqueado.'
                        },
                        500: {
                            description: 'Error interno al registrar.'
                        }
                    }
                }
            },
            '/api/login': {
                post: {
                    summary: 'Iniciar sesión',
                    description: 'Autentica un usuario y retorna un token JWT.',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        email: {
                                            type: 'string',
                                            example: 'usuario@correo.com'
                                        },
                                        password: {
                                            type: 'string',
                                            example: '123456'
                                        }
                                    },
                                    required: ['email', 'password']
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Login exitoso.'
                        },
                        401: {
                            description: 'Credenciales incorrectas.'
                        },
                        403: {
                            description: 'Usuario inactivo o bloqueado.'
                        },
                        500: {
                            description: 'Error en login.'
                        }
                    }
                }
            },
            '/api/productos': {
                get: {
                    summary: 'Listar productos',
                    description: 'Obtiene los productos disponibles con stock mayor a cero.',
                    responses: {
                        200: {
                            description: 'Lista de productos obtenida correctamente.'
                        },
                        500: {
                            description: 'Error al obtener productos.'
                        }
                    }
                },
                post: {
                    summary: 'Publicar producto',
                    description: 'Permite a un usuario productor crear una publicación de producto con imágenes y stock.',
                    security: [
                        {
                            bearerAuth: []
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'multipart/form-data': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        nombre: {
                                            type: 'string',
                                            example: 'Tomate orgánico'
                                        },
                                        descripcion: {
                                            type: 'string',
                                            example: 'Producto fresco de cultivo local'
                                        },
                                        precio: {
                                            type: 'number',
                                            example: 5000
                                        },
                                        categoria: {
                                            type: 'string',
                                            example: 'Verduras'
                                        },
                                        stock: {
                                            type: 'number',
                                            example: 20
                                        },
                                        imagenes: {
                                            type: 'array',
                                            items: {
                                                type: 'string',
                                                format: 'binary'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Producto creado correctamente.'
                        },
                        403: {
                            description: 'No autorizado.'
                        },
                        500: {
                            description: 'Error al crear producto.'
                        }
                    }
                }
            },
            '/api/mis-productos': {
                get: {
                    summary: 'Listar productos del productor',
                    description: 'Obtiene los productos publicados por el productor autenticado.',
                    security: [
                        {
                            bearerAuth: []
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Lista de productos del productor.'
                        },
                        403: {
                            description: 'No autorizado.'
                        },
                        500: {
                            description: 'Error al obtener inventario.'
                        }
                    }
                }
            },
            '/api/pedidos': {
                post: {
                    summary: 'Crear pedido',
                    description: 'Permite a un consumidor crear un pedido con productos del carrito.',
                    security: [
                        {
                            bearerAuth: []
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        total: {
                                            type: 'number',
                                            example: 25000
                                        },
                                        carrito: {
                                            type: 'array',
                                            items: {
                                                type: 'object'
                                            }
                                        },
                                        tipo_entrega: {
                                            type: 'string',
                                            example: 'domicilio'
                                        },
                                        direccion: {
                                            type: 'string',
                                            example: 'Calle 123'
                                        },
                                        barrio: {
                                            type: 'string',
                                            example: 'Centro'
                                        },
                                        telefono: {
                                            type: 'string',
                                            example: '3001234567'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Pedido creado correctamente.'
                        },
                        400: {
                            description: 'Error en la creación del pedido.'
                        },
                        403: {
                            description: 'Solo consumidores.'
                        }
                    }
                }
            },
            '/api/mis-pedidos': {
                get: {
                    summary: 'Historial de pedidos del consumidor',
                    description: 'Obtiene el historial de pedidos realizados por el consumidor autenticado.',
                    security: [
                        {
                            bearerAuth: []
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Historial obtenido correctamente.'
                        },
                        500: {
                            description: 'Error al obtener historial.'
                        }
                    }
                }
            },
            '/api/perfil': {
                get: {
                    summary: 'Obtener perfil de usuario',
                    description: 'Obtiene la información del perfil del usuario autenticado.',
                    security: [
                        {
                            bearerAuth: []
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Perfil obtenido correctamente.'
                        },
                        500: {
                            description: 'Error al obtener perfil.'
                        }
                    }
                },
                put: {
                    summary: 'Actualizar perfil de usuario',
                    description: 'Actualiza los datos personales del usuario autenticado.',
                    security: [
                        {
                            bearerAuth: []
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Perfil actualizado correctamente.'
                        },
                        500: {
                            description: 'Error al actualizar perfil.'
                        }
                    }
                }
            },
            '/api/admin/usuarios': {
                get: {
                    summary: 'Listar usuarios para administrador',
                    description: 'Obtiene la lista de usuarios registrados. Solo disponible para usuarios administradores.',
                    security: [
                        {
                            bearerAuth: []
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Lista de usuarios obtenida correctamente.'
                        },
                        403: {
                            description: 'Acceso denegado.'
                        },
                        500: {
                            description: 'Error al obtener usuarios.'
                        }
                    }
                }
            }
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },
    apis: ['./index.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta de documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Ruta principal de estado de la API
app.get('/', (req, res) => {
    res.json({
        mensaje: 'API de ConectaLocal funcionando correctamente',
        estado: 'online',
        documentacion: '/api-docs',
        rutas: {
            pruebaBaseDatos: '/test-db',
            productos: '/api/productos',
            registro: '/api/registro',
            login: '/api/login'
        }
    });
});

// ==========================================
// CONFIGURACIÓN DE IMÁGENES (MULTER)
// ==========================================
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });
app.use('/uploads', express.static('uploads'));

// ==========================================
// 1. RUTA DE PRUEBA
// ==========================================
app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ mensaje: '¡Conexión exitosa!', hora: result.rows[0].now });
    } catch (err) {
        res.status(500).send('Error de base de datos');
    }
});

// ==========================================
// 2. REGISTRO (MODIFICADO PARA ESTADOS)
// ==========================================
app.post('/api/registro', async (req, res) => {
    try {
        const {
            nombre,
            email,
            correo,
            password,
            rol,
            nombre_negocio,
            direccion,
            barrio
        } = req.body;

        const emailFinal = email || correo;
        const rolFinal = rol || 'consumidor';
        const nombreNegocioFinal = nombre_negocio || null;
        const direccionFinal = direccion || null;
        const barrioFinal = barrio || null;

        if (!nombre || !emailFinal || !password) {
            return res.status(400).json({
                error: 'Nombre, email y password son obligatorios'
            });
        }

        // 1. Verificamos si el correo ya existe
        const usuarioExistente = await pool.query(
            "SELECT * FROM usuarios WHERE email = $1",
            [emailFinal]
        );

        if (usuarioExistente.rows.length > 0) {
            const estadoActual = usuarioExistente.rows[0].estado || 'activo';

            // Si está bloqueado permanentemente
            if (estadoActual === 'bloqueado') {
                return res.status(403).json({
                    error: "El correo o documento fue bloqueado. Para desbloquear contacte con el administrador."
                });
            }

            // Si está inactivo, le permitimos reactivarse
            if (estadoActual === 'inactivo') {
                const salt = await bcrypt.genSalt(10);
                const bcryptPassword = await bcrypt.hash(password, salt);

                const usuarioReactivado = await pool.query(
                    `UPDATE usuarios 
                     SET estado = 'activo',
                         nombre = $1,
                         password = $2,
                         rol = $3,
                         nombre_negocio = $4,
                         direccion = $5,
                         barrio = $6 
                     WHERE email = $7
                     RETURNING *`,
                    [
                        nombre,
                        bcryptPassword,
                        rolFinal,
                        nombreNegocioFinal,
                        direccionFinal,
                        barrioFinal,
                        emailFinal
                    ]
                );

                return res.json({
                    mensaje: "Cuenta reactivada exitosamente. Bienvenido de nuevo.",
                    usuario: usuarioReactivado.rows[0]
                });
            }

            // Si está activo y trata de registrarse de nuevo
            return res.status(400).json({
                error: "El usuario ya está registrado y activo."
            });
        }

        // 2. Si no existe, lo creamos normalmente
        const salt = await bcrypt.genSalt(10);
        const bcryptPassword = await bcrypt.hash(password, salt);

        const nuevoUsuario = await pool.query(
            `INSERT INTO usuarios 
                (nombre, email, password, rol, nombre_negocio, direccion, barrio, estado)
             VALUES 
                ($1, $2, $3, $4, $5, $6, $7, 'activo')
             RETURNING *`,
            [
                nombre,
                emailFinal,
                bcryptPassword,
                rolFinal,
                nombreNegocioFinal,
                direccionFinal,
                barrioFinal
            ]
        );

        return res.json({
            mensaje: "Usuario creado",
            usuario: nuevoUsuario.rows[0]
        });

    } catch (err) {
        console.error('Error al registrar:', err);
        return res.status(500).send('Error al registrar');
    }
});


// ==========================================
// 3. LOGIN (MODIFICADO PARA BLOQUEAR INACTIVOS/BLOQUEADOS)
// ==========================================
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const usuario = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
        
        if (usuario.rows.length === 0) return res.status(401).json({ error: "Credenciales incorrectas" });

        const estadoUsuario = usuario.rows[0].estado || 'activo';

        if (estadoUsuario === 'bloqueado') {
            return res.status(403).json({ error: "Su cuenta ha sido bloqueada. Contacte al administrador." });
        }
        if (estadoUsuario === 'inactivo') {
            return res.status(403).json({ error: "Su cuenta está inactiva. Regístrese nuevamente para reactivarla." });
        }

        const passwordValida = await bcrypt.compare(password, usuario.rows[0].password);
        if (!passwordValida) return res.status(401).json({ error: "Credenciales incorrectas" });

        const token = jwt.sign(
            { id: usuario.rows[0].id, rol: usuario.rows[0].rol }, 
            process.env.JWT_SECRET, 
            { expiresIn: "2h" } 
        );

        res.json({ 
            token, 
            usuario: { 
                id: usuario.rows[0].id, 
                nombre: usuario.rows[0].nombre, 
                rol: usuario.rows[0].rol,
                estado: estadoUsuario
            } 
        });
    } catch (err) {
        res.status(500).send("Error en login");
    }
});

// ==========================================
// 4. PUBLICAR PRODUCTO (CON STOCK)
// ==========================================
app.post('/api/productos', validarToken, upload.array('imagenes', 5), async (req, res) => {
    try {
        if (req.usuario.rol !== 'productor') return res.status(403).json({ error: "No autorizado" });

        const { nombre, descripcion, precio, categoria, stock } = req.body;
        const rutasImagenes = req.files.map(file => `/uploads/${file.filename}`);

        const nuevoProducto = await pool.query(
            "INSERT INTO productos (nombre, descripcion, precio, categoria, imagenes, productor_id, stock) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [nombre, descripcion, precio, categoria, rutasImagenes, req.usuario.id, stock]
        );
        res.json(nuevoProducto.rows[0]);
    } catch (err) {
        res.status(500).send("Error al crear producto");
    }
});

// ==========================================
// 5. VER PRODUCTOS (FILTRA SI NO HAY STOCK)
// ==========================================
app.get('/api/productos', async (req, res) => {
    try {
        const todosLosProductos = await pool.query(`
            SELECT p.*, u.nombre AS nombre_productor 
            FROM productos p 
            JOIN usuarios u ON p.productor_id = u.id
            WHERE p.stock > 0
            ORDER BY p.id DESC
        `);
        res.json(todosLosProductos.rows);
    } catch (err) {
        res.status(500).send("Error al obtener productos");
    }
});

// ==========================================
// 6. GESTIÓN DE INVENTARIO (MIS PRODUCTOS)
// ==========================================

app.get('/api/mis-productos', validarToken, async (req, res) => {
    try {
        if (req.usuario.rol !== 'productor') {
            return res.status(403).json({ error: "No autorizado" });
        }

        const productos = await pool.query(`
            SELECT 
                p.*,
                COUNT(pr.id) FILTER (WHERE pr.respuesta IS NULL OR pr.respuesta = '') AS preguntas_pendientes
            FROM productos p
            LEFT JOIN preguntas_respuestas pr 
                ON p.id = pr.producto_id
            WHERE p.productor_id = $1
            GROUP BY p.id
            ORDER BY p.id DESC
        `, [req.usuario.id]);

        res.json(productos.rows);
    } catch (err) {
        console.error("Error al obtener inventario:", err);
        res.status(500).send("Error al obtener inventario");
    }
});


app.put('/api/productos/:id/gestion', validarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { stock, precio } = req.body;
        const resultado = await pool.query(
            "UPDATE productos SET stock = $1, precio = $2 WHERE id = $3 AND productor_id = $4 RETURNING *",
            [stock, precio, id, req.usuario.id]
        );
        res.json(resultado.rows[0]);
    } catch (err) {
        res.status(500).send("Error al actualizar");
    }
});

app.delete('/api/productos/:id', validarToken, async (req, res) => {
    try {
        await pool.query("DELETE FROM productos WHERE id = $1 AND productor_id = $2", [req.params.id, req.usuario.id]);
        res.json({ mensaje: "Eliminado correctamente" });
    } catch (err) {
        res.status(500).send("Error al eliminar");
    }
});

// ==========================================
// 7. CREAR PEDIDO (CON DATOS DE ENTREGA)
// ==========================================
app.post('/api/pedidos', validarToken, async (req, res) => {
    const client = await pool.connect();
    try {
        if (req.usuario.rol !== 'consumidor') return res.status(403).json({ error: "Solo consumidores" });
        
        await client.query('BEGIN'); 
        const { total, carrito, tipo_entrega, direccion, barrio, telefono } = req.body; 

        const nuevoPedido = await client.query(
            `INSERT INTO pedidos (consumidor_id, total, estado, tipo_entrega, direccion_envio, barrio_envio, telefono_contacto) 
             VALUES ($1, $2, 'pendiente', $3, $4, $5, $6) RETURNING id`, 
            [req.usuario.id, total, tipo_entrega, direccion, barrio, telefono]
        );
        const pedido_id = nuevoPedido.rows[0].id;

        for (let item of carrito) {
            const resStock = await client.query("SELECT stock FROM productos WHERE id = $1", [item.id]);
            if (resStock.rows[0].stock < item.cantidad) {
                throw new Error(`Stock insuficiente para el producto: ${item.nombre}`);
            }

            await client.query("UPDATE productos SET stock = stock - $1 WHERE id = $2", [item.cantidad, item.id]);

            await client.query(
                "INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)", 
                [pedido_id, item.id, item.cantidad, item.precio]
            );
        }

        await client.query('COMMIT'); 
        res.json({ mensaje: "Pedido exitoso", pedido_id });
    } catch (err) {
        await client.query('ROLLBACK'); 
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
});

// ==========================================
// 8. HISTORIAL DE PEDIDOS (CONSUMIDOR)
// ==========================================
app.get('/api/mis-pedidos', validarToken, async (req, res) => {
    try {
        const pedidos = await pool.query(`
            SELECT 
                p.id, p.fecha_pedido, p.estado, p.total, p.tipo_entrega,
                json_agg(json_build_object(
                    'nombre', pr.nombre, 
                    'cantidad', dp.cantidad,
                    'precio', dp.precio_unitario
                )) AS productos
            FROM pedidos p
            JOIN detalle_pedidos dp ON p.id = dp.pedido_id
            JOIN productos pr ON dp.producto_id = pr.id
            WHERE p.consumidor_id = $1
            GROUP BY p.id
            ORDER BY p.fecha_pedido DESC
        `, [req.usuario.id]);
        
        res.json(pedidos.rows);
    } catch (err) {
        res.status(500).send("Error al obtener historial");
    }
});

// ==========================================
// 9. CANCELAR PEDIDO
// ==========================================
app.post('/api/pedidos/:id/cancelar', validarToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        await client.query('BEGIN');
        const pedido = await client.query("SELECT fecha_pedido, estado FROM pedidos WHERE id = $1", [id]);
        
        if (pedido.rows.length === 0) throw new Error("Pedido no encontrado");
        if ((new Date() - new Date(pedido.rows[0].fecha_pedido)) / 60000 > 20) throw new Error("Plazo vencido");

        const detalles = await client.query("SELECT producto_id, cantidad FROM detalle_pedidos WHERE pedido_id = $1", [id]);
        for (let item of detalles.rows) {
            await client.query("UPDATE productos SET stock = stock + $1 WHERE id = $2", [item.cantidad, item.producto_id]);
        }

        await client.query("UPDATE pedidos SET estado = 'cancelado' WHERE id = $1", [id]);
        await client.query('COMMIT');
        res.json({ mensaje: "Pedido cancelado" });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
});

// ==========================================
// 10. VER VENTAS (PRODUCTOR - CON INFO DE ENTREGA)
// ==========================================
app.get('/api/mis-ventas', validarToken, async (req, res) => {
    try {
        if (req.usuario.rol !== 'productor') return res.status(403).json({ error: "No autorizado" });

        const ventas = await pool.query(`
            SELECT 
                p.id AS pedido_id, p.fecha_pedido, p.estado, p.total, p.tipo_entrega,
                p.direccion_envio, p.barrio_envio, p.telefono_contacto,
                u.nombre AS cliente,
                json_agg(json_build_object(
                    'producto', pr.nombre, 
                    'cantidad', dp.cantidad,
                    'precio', dp.precio_unitario
                )) AS productos
            FROM pedidos p
            JOIN usuarios u ON p.consumidor_id = u.id
            JOIN detalle_pedidos dp ON p.id = dp.pedido_id
            JOIN productos pr ON dp.producto_id = pr.id
            WHERE pr.productor_id = $1
            GROUP BY p.id, u.id
            ORDER BY p.fecha_pedido DESC
        `, [req.usuario.id]);

        res.json(ventas.rows);
    } catch (err) {
        res.status(500).send("Error al obtener ventas");
    }
});

// ==========================================
// 11. ACTUALIZAR ESTADO (PRODUCTOR)
// ==========================================
app.put('/api/pedidos/:id/estado', validarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        await pool.query("UPDATE pedidos SET estado = $1 WHERE id = $2", [estado, id]);
        res.json({ mensaje: "Estado actualizado" });
    } catch (err) {
        console.error("ERROR BD:", err.message); 
        res.status(500).send("Error al actualizar");
    }
});

// ==========================================
// 12. OBTENER PERFIL DE USUARIO
// ==========================================
app.get('/api/perfil', validarToken, async (req, res) => {
    try {
        const usuario = await pool.query(
            "SELECT id, nombre, apellidos, email, rol, nombre_negocio, direccion, barrio, ciudad, telefono, preferencias, foto_perfil, estado FROM usuarios WHERE id = $1", 
            [req.usuario.id]
        );
        res.json(usuario.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener perfil" });
    }
});

// ==========================================
// 13. ACTUALIZAR FOTO DE PERFIL
// ==========================================
app.put('/api/perfil/foto', validarToken, upload.single('foto'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No se subió ninguna imagen" });

        const rutaFoto = `/uploads/${req.file.filename}`;
        
        await pool.query(
            "UPDATE usuarios SET foto_perfil = $1 WHERE id = $2",
            [rutaFoto, req.usuario.id]
        );
        
        res.json({ mensaje: "Foto actualizada con éxito", foto_perfil: rutaFoto });
    } catch (err) {
        res.status(500).json({ error: "Error al actualizar la foto" });
    }
});

// ==========================================
// 14. ACTUALIZAR DATOS DEL PERFIL
// ==========================================
app.put('/api/perfil', validarToken, async (req, res) => {
    try {
        const { nombre, apellidos, direccion, barrio, ciudad, telefono, preferencias } = req.body;
        
        await pool.query(
            `UPDATE usuarios 
             SET nombre = $1, apellidos = $2, direccion = $3, barrio = $4, ciudad = $5, telefono = $6, preferencias = $7 
             WHERE id = $8`,
            [nombre, apellidos, direccion, barrio, ciudad, telefono, preferencias, req.usuario.id]
        );
        
        res.json({ mensaje: "Perfil actualizado correctamente" });
    } catch (err) {
        res.status(500).json({ error: "Error al actualizar el perfil" });
    }
});


// ==========================================
// 15. ADMINISTRADOR: VER TODOS LOS USUARIOS
// ==========================================
app.get('/api/admin/usuarios', validarToken, async (req, res) => {
    try {
        // Verificamos que quien consulta sea un administrador
        if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'administrador') {
            return res.status(403).json({ error: "Acceso denegado. Solo para administradores." });
        }

        const usuarios = await pool.query(
            "SELECT id, nombre, email, rol, nombre_negocio, estado FROM usuarios ORDER BY id DESC"
        );
        res.json(usuarios.rows);
    } catch (err) {
        res.status(500).send("Error al obtener la lista de usuarios");
    }
});

// ==========================================
// 16. ADMINISTRADOR: CAMBIAR ESTADO A USUARIO
// ==========================================
app.put('/api/admin/usuarios/:id/estado', validarToken, async (req, res) => {
    try {
        if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'administrador') {
            return res.status(403).json({ error: "Acceso denegado. Solo para administradores." });
        }

        const { id } = req.params;
        const { estado } = req.body; // Debe ser: 'activo', 'inactivo', o 'bloqueado'

        if (!['activo', 'inactivo', 'bloqueado'].includes(estado)) {
            return res.status(400).json({ error: "Estado no válido. Use activo, inactivo o bloqueado." });
        }

        const usuarioActualizado = await pool.query(
            "UPDATE usuarios SET estado = $1 WHERE id = $2 RETURNING id, nombre, email, estado",
            [estado, id]
        );

        if (usuarioActualizado.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado." });
        }

        res.json({ 
            mensaje: `El usuario ahora está ${estado}`, 
            usuario: usuarioActualizado.rows[0] 
        });
    } catch (err) {
        res.status(500).send("Error al actualizar el estado del usuario");
    }
});

// ==========================================
// 17. ADMINISTRADOR: VER TODAS LAS PUBLICACIONES
// ==========================================
app.get('/api/admin/productos', validarToken, async (req, res) => {
    try {
        if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'administrador') {
            return res.status(403).json({ error: "Acceso denegado." });
        }
        const productos = await pool.query(`
            SELECT p.id, p.nombre, p.descripcion, p.precio, p.stock, p.imagenes, u.nombre AS productor
            FROM productos p
            JOIN usuarios u ON p.productor_id = u.id
            ORDER BY p.id DESC
        `);
        res.json(productos.rows);
    } catch (err) {
        res.status(500).send("Error al obtener publicaciones");
    }
});

// ==========================================
// 18. ADMINISTRADOR: ELIMINAR PUBLICACIÓN (MODERAR)
// ==========================================
app.delete('/api/admin/productos/:id', validarToken, async (req, res) => {
    try {
        if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'administrador') {
            return res.status(403).json({ error: "Acceso denegado." });
        }
        await pool.query("DELETE FROM productos WHERE id = $1", [req.params.id]);
        res.json({ mensaje: "Publicación eliminada por el administrador." });
    } catch (err) {
        res.status(500).send("Error al eliminar el producto");
    }
});

// ==========================================
// 19. ADMINISTRADOR: VER TODAS LAS TRANSACCIONES (COMPRAS/VENTAS)
// ==========================================
app.get('/api/admin/pedidos', validarToken, async (req, res) => {
    try {
        if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'administrador') {
            return res.status(403).json({ error: "Acceso denegado." });
        }
        
        // Obtenemos los pedidos relacionando comprador y vendedor(es)
        const pedidos = await pool.query(`
            SELECT 
                p.id, p.fecha_pedido, p.estado, p.total,
                c.nombre AS comprador, c.email AS email_comprador,
                string_agg(DISTINCT u_prod.nombre, ', ') AS vendedores
            FROM pedidos p
            JOIN usuarios c ON p.consumidor_id = c.id
            JOIN detalle_pedidos dp ON p.id = dp.pedido_id
            JOIN productos prod ON dp.producto_id = prod.id
            JOIN usuarios u_prod ON prod.productor_id = u_prod.id
            GROUP BY p.id, c.nombre, c.email
            ORDER BY p.fecha_pedido DESC
        `);
        res.json(pedidos.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al obtener las transacciones");
    }
});

// ==========================================
// 20. SISTEMA DE PREGUNTAS Y RESPUESTAS (PRE-VENTA)
// ==========================================

// A. Obtener preguntas de un producto específico (Público)
app.get('/api/productos/:id/preguntas', async (req, res) => {
    try {
        const preguntas = await pool.query(`
            SELECT pr.id, pr.pregunta, pr.respuesta, pr.fecha_pregunta, pr.fecha_respuesta, u.nombre AS consumidor
            FROM preguntas_respuestas pr
            JOIN usuarios u ON pr.consumidor_id = u.id
            WHERE pr.producto_id = $1
            ORDER BY pr.fecha_pregunta DESC
        `, [req.params.id]);
        res.json(preguntas.rows);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener las preguntas" });
    }
});

// B. Consumidor hace una pregunta
app.post('/api/productos/:id/preguntas', validarToken, async (req, res) => {
    try {
        if (req.usuario.rol !== 'consumidor') return res.status(403).json({ error: "Solo los consumidores pueden preguntar" });
        
        const { pregunta } = req.body;
        const nuevaPregunta = await pool.query(
            "INSERT INTO preguntas_respuestas (producto_id, consumidor_id, pregunta) VALUES ($1, $2, $3) RETURNING *",
            [req.params.id, req.usuario.id, pregunta]
        );
        res.json({ mensaje: "Pregunta enviada", data: nuevaPregunta.rows[0] });
    } catch (err) {
        res.status(500).json({ error: "Error al enviar la pregunta" });
    }
});

// C. Productor responde la pregunta

app.put('/api/preguntas/:id/responder', validarToken, async (req, res) => {
    try {
        if (req.usuario.rol !== 'productor') {
            return res.status(403).json({ error: "Solo productores pueden responder" });
        }

        const { respuesta } = req.body;

        if (!respuesta || respuesta.trim() === '') {
            return res.status(400).json({ error: "La respuesta no puede estar vacía" });
        }

        const preguntaRespondida = await pool.query(`
            UPDATE preguntas_respuestas pr
            SET respuesta = $1, fecha_respuesta = CURRENT_TIMESTAMP
            FROM productos p
            WHERE pr.producto_id = p.id
              AND pr.id = $2
              AND p.productor_id = $3
            RETURNING pr.*
        `, [respuesta, req.params.id, req.usuario.id]);

        if (preguntaRespondida.rows.length === 0) {
            return res.status(404).json({
                error: "Pregunta no encontrada o no tienes permiso para responderla"
            });
        }

        res.json({
            mensaje: "Respuesta publicada",
            data: preguntaRespondida.rows[0]
        });
    } catch (err) {
        console.error("Error al responder pregunta:", err);
        res.status(500).json({ error: "Error al responder" });
    }
});


// ==========================================
// 21. SISTEMA DE MENSAJERÍA PRIVADA (POST-VENTA)
// ==========================================

// A. Obtener chat de un pedido
app.get('/api/pedidos/:id/mensajes', validarToken, async (req, res) => {
    try {
        const mensajes = await pool.query(`
            SELECT m.id, m.mensaje, m.fecha_envio, m.remitente_id, u.nombre AS remitente_nombre, u.rol AS remitente_rol
            FROM mensajes_pedido m
            JOIN usuarios u ON m.remitente_id = u.id
            WHERE m.pedido_id = $1
            ORDER BY m.fecha_envio ASC
        `, [req.params.id]);
        res.json(mensajes.rows);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener el chat" });
    }
});

// B. Enviar mensaje en un pedido
app.post('/api/pedidos/:id/mensajes', validarToken, async (req, res) => {
    try {
        const { mensaje } = req.body;
        const nuevoMensaje = await pool.query(
            "INSERT INTO mensajes_pedido (pedido_id, remitente_id, mensaje) VALUES ($1, $2, $3) RETURNING *",
            [req.params.id, req.usuario.id, mensaje]
        );
        res.json({ mensaje: "Mensaje enviado", data: nuevoMensaje.rows[0] });
    } catch (err) {
        res.status(500).json({ error: "Error al enviar el mensaje" });
    }
});

// ==========================================
// 22. CONTACTA CON NOSOTROS
// ==========================================

app.post('/api/contacto', async (req, res) => {
    try {
        const { nombre, email, asunto, mensaje } = req.body;
        await pool.query(
            "INSERT INTO contactos (nombre, email, asunto, mensaje) VALUES ($1, $2, $3, $4)",
            [nombre, email, asunto, mensaje]
        );
        res.json({ mensaje: "Mensaje enviado correctamente. El admin lo revisará pronto." });
    } catch (err) {
        res.status(500).json({ error: "Error al enviar el mensaje" });
    }
});

// ==========================================
// 23. ADMINISTRADOR: GESTIÓN DE REPORTES Y ADMINS
// ==========================================

// A. Ver todos los mensajes de contacto
app.get('/api/admin/contactos', validarToken, async (req, res) => {
    if (req.usuario.rol !== 'admin') return res.status(403).json({ error: "Solo admin" });
    const mensajes = await pool.query("SELECT * FROM contactos ORDER BY fecha_envio DESC");
    res.json(mensajes.rows);
});

// B. Promover un usuario a administrador (por email)
app.put('/api/admin/promover', validarToken, async (req, res) => {
    if (req.usuario.rol !== 'admin') return res.status(403).json({ error: "Solo admin" });
    const { email } = req.body;
    try {
        const result = await pool.query("UPDATE usuarios SET rol = 'admin' WHERE email = $1 RETURNING *", [email]);
        if (result.rowCount === 0) return res.status(404).json({ error: "Usuario no encontrado" });
        res.json({ mensaje: "Usuario ascendido a administrador con éxito" });
    } catch (err) { res.status(500).json({ error: "Error al promover usuario" }); }
});

// ==========================================
// FINAL DEL ARCHIVO index.js
// ==========================================

module.exports = app;

/* istanbul ignore next */
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor de ConectaLocal corriendo en el puerto ${PORT}`);
    });
}
