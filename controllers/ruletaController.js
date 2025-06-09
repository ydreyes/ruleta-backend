const db = require('../db');
const jwt = require('jsonwebtoken');

function elegirPremioConProbabilidad(premios) {
  const total = premios.reduce((sum, p) => sum + parseFloat(p.probabilidad), 0);
  const rand = Math.random() * total;
  let acumulado = 0;
  for (let premio of premios) {
    acumulado += parseFloat(premio.probabilidad);
    if (rand <= acumulado) return premio;
  }
  return premios[premios.length - 1]; // fallback
}

exports.spin = (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(403).json({ error: 'Token no proporcionado' });

  let userData;
  try {
    userData = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  db.query('SELECT * FROM premios', (err, premios) => {
    if (err || premios.length === 0) return res.status(500).json({ error: 'Sin premios disponibles' });

    const premio = elegirPremioConProbabilidad(premios);
    const fechaGanado = new Date();
    const fechaCaducidad = new Date(fechaGanado);
    fechaCaducidad.setDate(fechaCaducidad.getDate() + premio.dias_caducidad);

    db.query(
      'INSERT INTO registros_ruleta (user_id, premio_id, fecha_ganado, fecha_caducidad) VALUES (?, ?, ?, ?)',
      [userData.id, premio.id, fechaGanado, fechaCaducidad],
      (err2, result) => {
        if (err2) return res.status(500).json({ error: 'Error al guardar el premio' });

        res.json({
          success: true,
          premio: {
            id: premio.id,
            nombre: premio.nombre,
            color: premio.color,
            descripcion: premio.descripcion,
            fechaGanado,
            fechaCaducidad,
          },
        });
      }
    );
  });
};

exports.historial = (req, res) => {
  const userId = req.params.id;

  db.query(
    `SELECT r.*, p.nombre AS premio, p.descripcion, p.color 
     FROM registros_ruleta r
     JOIN premios p ON r.premio_id = p.id
     WHERE r.user_id = ?
     ORDER BY r.fecha_ganado DESC`,
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Error al obtener historial' });
      res.json({ success: true, historial: results });
    }
  );
};
