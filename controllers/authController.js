const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { nombre, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
      [nombre, email, hashedPassword],
      (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al registrar usuario' });
        res.status(201).json({ success: true, message: 'Usuario registrado' });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  db.query(
    'SELECT * FROM usuarios WHERE email = ?',
    [email],
    async (err, results) => {
      if (err || results.length === 0) {
        return res.status(401).json({ error: 'Usuario no encontrado' });
      }

      const user = results[0];
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' });

      const token = jwt.sign({ id: user.id, nombre: user.nombre }, process.env.JWT_SECRET, {
        expiresIn: '1d',
      });

      res.json({
        success: true,
        token,
        usuario: { id: user.id, nombre: user.nombre, email: user.email },
      });
    }
  );
};
