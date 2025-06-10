const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const apiRoutes = require('./routes/api');
const dashboardRoutes = require('./routes/dashboard');

app.use(cors({ 
    origin: ['https://ruleta-app-seven.vercel.app'], // reemplaza con tu URL real de Vercel
    credentials: true
 }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'secretKey', resave: false, saveUninitialized: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/api', apiRoutes);
app.use('/admin', dashboardRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor iniciado en http://localhost:${PORT}`));
