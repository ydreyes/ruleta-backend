const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const ruletaController = require('../controllers/ruletaController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/spin', ruletaController.spin);
router.get('/historial/:id', ruletaController.historial);

module.exports = router;