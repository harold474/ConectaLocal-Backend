const pool = require('./db');

const crearTablas = async () => {
    const querySQL = `
        CREATE TABLE IF NOT EXISTS usuarios (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            rol VARCHAR(50) NOT NULL CHECK (rol IN ('productor', 'consumidor', 'administrador')),
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS productos (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(150) NOT NULL,
            descripcion TEXT,
            precio DECIMAL(10, 2) NOT NULL,
            categoria VARCHAR(100),
            imagen_url VARCHAR(255),
            productor_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
            fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS pedidos (
            id SERIAL PRIMARY KEY,
            consumidor_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
            total DECIMAL(10, 2) NOT NULL,
            estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completado')),
            fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS detalle_pedidos (
            id SERIAL PRIMARY KEY,
            pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
            producto_id INTEGER REFERENCES productos(id),
            cantidad INTEGER NOT NULL CHECK (cantidad > 0),
            precio_unitario DECIMAL(10, 2) NOT NULL
        );
    `;

    try {
        console.log("Creando tablas en la base de datos...");
        await pool.query(querySQL);
        console.log("✅ ¡Las tablas de ConectaLocal se crearon con éxito!");
    } catch (error) {
        console.error("❌ Error al crear las tablas:", error);
    } finally {
        // Cierra la conexión para que el script termine
        pool.end(); 
    }
};

crearTablas();