const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
require('dotenv').config();
const pool = require('./db');

// Importamos el guardia de seguridad
const validarToken = require('./middleware/validarToken');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

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
// 2. REGISTRO
// ==========================================
app.post('/api/registro', async (req, res) => {
    try {
        const { nombre, email, password, rol, nombre_negocio, direccion, barrio } = req.body;
        const salt = await bcrypt.genSalt(10);
        const bcryptPassword = await bcrypt.hash(password, salt);
        const nuevoUsuario = await pool.query(
            "INSERT INTO usuarios (nombre, email, password, rol, nombre_negocio, direccion, barrio) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [nombre, email, bcryptPassword, rol, nombre_negocio, direccion, barrio]
        );
        res.json({ mensaje: "Usuario creado", usuario: nuevoUsuario.rows[0] });
    } catch (err) {
        res.status(500).send("Error al registrar");
    }
});

// ==========================================
// 3. LOGIN
// ==========================================
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const usuario = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
        if (usuario.rows.length === 0) return res.status(401).json({ error: "Credenciales incorrectas" });

        const passwordValida = await bcrypt.compare(password, usuario.rows[0].password);
        if (!passwordValida) return res.status(401).json({ error: "Credenciales incorrectas" });

        const token = jwt.sign(
            { id: usuario.rows[0].id, rol: usuario.rows[0].rol }, 
            process.env.JWT_SECRET, 
            { expiresIn: "2h" } 
        );

        res.json({ token, usuario: { id: usuario.rows[0].id, nombre: usuario.rows[0].nombre, rol: usuario.rows[0].rol } });
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
        const productos = await pool.query(
            "SELECT * FROM productos WHERE productor_id = $1 ORDER BY id DESC",
            [req.usuario.id]
        );
        res.json(productos.rows);
    } catch (err) {
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
            "SELECT id, nombre, apellidos, email, rol, nombre_negocio, direccion, barrio, ciudad, telefono, preferencias, foto_perfil FROM usuarios WHERE id = $1", 
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor de ConectaLocal corriendo en el puerto ${PORT}`));