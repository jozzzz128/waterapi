//ENV
require('dotenv').config();

// Server
const express = require('express');
const app = express();
const port = process.env.PORT;

//JWT
const {verifyToken, getCredentials} = require('./tools/jwt');
//Data management
const {setData, getData} = require('./tools/data');

// Middleware para parsear JSON
app.use(express.json()); 
// View engine
app.set("view engine","ejs");
// Static directories
app.use('/static', express.static(__dirname +'/static'));

// Home
app.get('/', (req, res) => {
    res.render('home');
});

// ------------------------------------------------------------------
// RUTA PÚBLICA: Obtener Credenciales (Token JWT)
// El ESP8266 hará un GET a esta ruta para obtener su token.
// ------------------------------------------------------------------
app.get('/getcredentials', getCredentials);

// ------------------------------------------------------------------
// RUTA PRIVADA: Actualización de datos
// *Aplique el middleware verifyToken aquí*
// ------------------------------------------------------------------
app.post('/update', verifyToken, (req, res) => {
    // NOTA: req.user contiene el payload decodificado (ej: { deviceId: '...' })
    console.log(`Datos recibidos de: ${req.user.deviceId}`); 
    // Set and Validate data
    const response = setData(req.body);
    return res.status(response.code).json(response);
});

// Data - get
app.get('/data', (req, res) => {
    const response = getData();
    return res.status(response.code).json(response);
});

// Raise server
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});