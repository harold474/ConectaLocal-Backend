import pool from './db.js'; 

async function actualizarBaseDeDatos() {
    try {
        console.log("⏳ Iniciando actualización de tablas...");

        // 1. Campos de envío para la tabla PEDIDOS
        await pool.query(`
            ALTER TABLE pedidos 
            ADD COLUMN IF NOT EXISTS tipo_entrega VARCHAR(20) DEFAULT 'domicilio',
            ADD COLUMN IF NOT EXISTS direccion_envio VARCHAR(255),
            ADD COLUMN IF NOT EXISTS barrio_envio VARCHAR(100),
            ADD COLUMN IF NOT EXISTS telefono_contacto VARCHAR(20);
        `);
        console.log("✅ Tabla 'pedidos' actualizada (Logística).");

        // 2. Campos extendidos para la tabla USUARIOS
        // Aquí añadimos apellidos, teléfono, ciudad y las preferencias de productos
        await pool.query(`
            ALTER TABLE usuarios 
            ADD COLUMN IF NOT EXISTS foto_perfil VARCHAR(255),
            ADD COLUMN IF NOT EXISTS apellidos VARCHAR(100),
            ADD COLUMN IF NOT EXISTS telefono VARCHAR(20),
            ADD COLUMN IF NOT EXISTS ciudad VARCHAR(100),
            ADD COLUMN IF NOT EXISTS preferencias TEXT;
        `);
        console.log("✅ Tabla 'usuarios' actualizada (Perfil completo).");

        console.log("🚀 Todas las tablas están al día.");
    } catch (err) {
        console.error("❌ Error al actualizar las tablas:", err.message);
    } finally {
        await pool.end();
        process.exit();
    }
}

actualizarBaseDeDatos();