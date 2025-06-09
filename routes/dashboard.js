const express = require('express');
const router = express.Router();
const db = require('../db');
const { Parser } = require('json2csv');

// LOGIN
router.get('/login', (req, res) => res.render('login'));

router.post('/login', (req, res) => {
  const { user, pass } = req.body;
  if (user === 'admin' && pass === '1234') {
    req.session.loggedIn = true;
    res.redirect('/admin');
  } else {
    res.redirect('/admin/login');
  }
});

// LOGOUT
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

// DASHBOARD
router.get('/', (req, res) => {
  if (!req.session.loggedIn) return res.redirect('/admin/login');

  const filtro = req.query.filtro || '';
  const pagina = parseInt(req.query.pagina) || 1;
  const porPagina = 10;
  const offset = (pagina - 1) * porPagina;

  // Conteo total
  const countSql = `
    SELECT COUNT(*) AS total
    FROM registros_ruleta r
    JOIN usuarios u ON u.id = r.user_id
    WHERE u.nombre LIKE ?`;

  db.query(countSql, [`%${filtro}%`], (err, countResult) => {
    if (err) return res.send('Error al contar resultados');

    const total = countResult[0].total;
    const totalPaginas = Math.ceil(total / porPagina);

    // Consulta paginada
    const sql = `
      SELECT r.*, u.nombre AS usuario, p.nombre AS premio, p.color
      FROM registros_ruleta r
      JOIN usuarios u ON u.id = r.user_id
      JOIN premios p ON p.id = r.premio_id
      WHERE u.nombre LIKE ?
      ORDER BY r.fecha_ganado DESC
      LIMIT ? OFFSET ?`;

    db.query(sql, [`%${filtro}%`, porPagina, offset], (err2, resultados) => {
      if (err2) return res.send('Error al obtener registros');

      res.render('dashboard', {
        registros: resultados,
        filtro,
        pagina,
        totalPaginas,
      });
    });
  });
});


// EXPORTAR A CSV
router.get('/export', (req, res) => {
  const sql = `
    SELECT u.nombre AS usuario, p.nombre AS premio, r.fecha_ganado, r.fecha_caducidad
    FROM registros_ruleta r
    JOIN usuarios u ON u.id = r.user_id
    JOIN premios p ON p.id = r.premio_id
    ORDER BY r.fecha_ganado DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).send('Error al exportar');

    const parser = new Parser();
    const csv = parser.parse(rows);

    res.header('Content-Type', 'text/csv');
    res.attachment('historial_ruleta.csv');
    return res.send(csv);
  });
});

// BORRAR REGISTRO
router.get('/eliminar/:id', (req, res) => {
  if (!req.session.loggedIn) return res.redirect('/admin/login');

  db.query('DELETE FROM registros_ruleta WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.send('Error al eliminar');
    res.redirect('/admin');
  });
});

// Mostrar pantalla de edición
router.get('/editar/:id', (req, res) => {
  if (!req.session.loggedIn) return res.redirect('/admin/login');

  const registroId = req.params.id;

  db.query('SELECT * FROM registros_ruleta WHERE id = ?', [registroId], (err, result) => {
    if (err || result.length === 0) return res.send('Registro no encontrado');
    const registro = result[0];

    db.query('SELECT * FROM usuarios', (errU, usuarios) => {
      if (errU) return res.send('Error al cargar usuarios');

      db.query('SELECT * FROM premios', (errP, premios) => {
        if (errP) return res.send('Error al cargar premios');

        res.render('editar', { registro, usuarios, premios });
      });
    });
  });
});

// Guardar edición
router.post('/editar/:id', (req, res) => {
  if (!req.session.loggedIn) return res.redirect('/admin/login');

  const { user_id, premio_id, fecha_ganado, fecha_caducidad } = req.body;
  const id = req.params.id;

  db.query(
    `UPDATE registros_ruleta 
     SET user_id = ?, premio_id = ?, fecha_ganado = ?, fecha_caducidad = ?
     WHERE id = ?`,
    [user_id, premio_id, fecha_ganado, fecha_caducidad, id],
    (err) => {
      if (err) return res.send('Error al actualizar');
      res.redirect('/admin');
    }
  );
});


module.exports = router;
