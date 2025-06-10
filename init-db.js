const pool = require('./db');

async function crearBaseDeDatos() {
  try {
    // Tabla de usuarios
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla de premios
    await pool.query(`
      CREATE TABLE IF NOT EXISTS premios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        color VARCHAR(20),
        probabilidad NUMERIC(5,4) DEFAULT 0.1000,
        dias_caducidad INT DEFAULT 30
      );
    `);

    // Tabla de registros de ruleta
    await pool.query(`
      CREATE TABLE IF NOT EXISTS registros_ruleta (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES usuarios(id),
        premio_id INT NOT NULL REFERENCES premios(id),
        fecha_ganado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_caducidad TIMESTAMP
      );
    `);

    // Premios
    await pool.query(`
      INSERT INTO premios (nombre, descripcion, color, probabilidad, dias_caducidad) VALUES
        ('Cupón 10% OFF', 'Descuento en productos seleccionados', '#FFD700', 0.3000, 15),
        ('Cupón 20% OFF', 'Descuento mayor por tiempo limitado', '#FF8C00', 0.2000, 10),
        ('Envío Gratis', 'Envía sin costo tu próxima compra', '#ADFF2F', 0.1500, 20),
        ('Premio Especial', 'Sorpresa exclusiva', '#FF1493', 0.0500, 7),
        ('Gracias por participar', 'Sin premio, pero vuelve a intentarlo', '#CCCCCC', 0.3000, 1)
      ON CONFLICT DO NOTHING;
    `);

    // Usuario de prueba (ya has generado la contraseña con bcrypt)
    await pool.query(`
      INSERT INTO usuarios (nombre, email, password)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO NOTHING;
    `, ['Juan Pérez', 'juan@example.com', '$2b$10$nOUIs5kJ7naTuTFkBy1veuEvjI6rRcsm29hM/NpE6X2RZVrmFUi7K']);

    // Registros de ruleta del usuario
    await pool.query(`
      INSERT INTO registros_ruleta (user_id, premio_id, fecha_ganado, fecha_caducidad)
      VALUES 
        (1, 1, NOW(), NOW() + INTERVAL '15 days'),
        (1, 2, NOW() - INTERVAL '3 days', NOW() + INTERVAL '12 days'),
        (1, 3, NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days');
    `);

    console.log('✅ Base de datos y datos de prueba creados exitosamente.');
  } catch (err) {
    console.error('❌ Error al crear la base de datos:', err);
  }
}

crearBaseDeDatos();
