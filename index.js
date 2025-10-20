// Server
const express = require('express');
const jwt = require('jsonwebtoken'); // Importamos JSON Web Token
const app = express();
const port = 80;

import * as dotenv from 'dotenv';
dotenv.config();

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// **********************************************
// CONFIGURACIÓN DE SEGURIDAD JWT
// **********************************************
// CRÍTICO: Leer la clave secreta desde las variables de entorno
const JWT_SECRET = "TOKENMAMALON"; 

// Verificar que la clave secreta esté cargada
if (!JWT_SECRET) {
    console.error("ERROR CRÍTICO: La variable de entorno JWT_SECRET no está definida.");
    console.error("Por favor, define JWT_SECRET (ej: JWT_SECRET='tu_clave_secreta') antes de iniciar el servidor.");
    process.exit(1); // Detener la aplicación si la clave no existe
}

const DEVICE_ID = 'ESP8266_WATER_MONITOR_001'; // ID de dispositivo para el payload JWT

// Middleware para parsear JSON
app.use(express.json()); 

// Data
const data = {
    error: -1,
    distanciaCm: -1,
    nivelAguaCm: -1,
    porcentajeAgua: -1,
    lastUpdated: new Date().toISOString()
};
const answer = {
    code: 200,
    message: '',
    body: data,
};
const errorResponse = {
    code: 500,
    message: ''
};

const getErrorMessage = (code) => {
    switch(code) {
        case 1:
            return "El tinaco esta destapado.";   
        case 2:
            return "Hay un desbordamiento.";
        case 3:
            return "No se detecto el sensor.";
        case 4:
            return "El tinaco esta completamente vacio.";
        default:
            return "Sin error reportado.";
    }
};

// ------------------------------------------------------------------
// MIDDLEWARE: Verificación de Token
// Extrae el token del encabezado de Autorización (Bearer Token)
// ------------------------------------------------------------------
const verifyToken = (req, res, next) => {
    // 1. Obtener el valor del encabezado Authorization (ej: 'Bearer <token>')
    const authHeader = req.headers['authorization'];
    
    // Si no hay encabezado, o no empieza con 'Bearer ', acceso denegado (401 Unauthorized)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        errorResponse.code = 401;
        errorResponse.message = 'Acceso denegado. Se requiere un token Bearer.';
        return res.status(401).json(errorResponse);
    }
    
    // 2. Extraer el token (quitando 'Bearer ')
    const token = authHeader.split(' ')[1];

    // 3. Verificar el token
    try {
        // Verificar y decodificar el token usando la clave secreta
        const verified = jwt.verify(token, JWT_SECRET);
        // Adjuntar el payload del token (ej. ID de dispositivo) a la solicitud
        req.user = verified;
        next(); // Continuar con el siguiente middleware o la función de ruta
    } catch (err) {
        // Si la verificación falla (token expirado, inválido, etc.)
        errorResponse.code = 403;
        errorResponse.message = 'Token inválido o expirado.';
        // En este caso, el token no debería expirar, pero este manejo de error
        // es útil para tokens manipulados o claves secretas incorrectas.
        return res.status(403).json(errorResponse);
    }
};


// Home
app.get('/', (req, res) => {
    //res.send('Welcome to the Water API');
    return res.status(200).json({key: process.env.JWT_SECRET});
});

// ------------------------------------------------------------------
// RUTA PÚBLICA: Obtener Credenciales (Token JWT)
// El ESP8266 hará un GET a esta ruta para obtener su token.
// ------------------------------------------------------------------
app.get('/getcredentials', (req, res) => {
    try {
        // Payload básico (se puede añadir más información)
        const payload = { 
            deviceId: DEVICE_ID,
            role: "device"
        };
        
        // Crear el token SIN opción de expiración (indefinido)
        const token = jwt.sign(payload, JWT_SECRET); 
        
        // Devolver el token al dispositivo
        return res.status(200).json({ token: token, expires_in: 'Never' });

    } catch (e) {
        console.error("Error al generar token:", e);
        errorResponse.message = 'Error al generar credenciales';
        return res.status(500).json(errorResponse);
    }
});

// ------------------------------------------------------------------
// RUTA PRIVADA: Actualización de datos
// *Aplique el middleware verifyToken aquí*
// ------------------------------------------------------------------
app.post('/update', verifyToken, (req, res) => {
    try {
        // NOTA: req.user contiene el payload decodificado (ej: { deviceId: '...' })
        console.log(`Datos recibidos de: ${req.user.deviceId}`); 

        const { error, distanciaCm, nivelAguaCm, porcentajeAgua } = req.body;

        // ** Validación básica de datos recibidos **
        if (typeof error === 'undefined' || typeof distanciaCm === 'undefined') {
            errorResponse.message = 'Faltan parámetros JSON requeridos.';
            return res.status(400).json(errorResponse);
        }

        // Update data
        data.error = parseInt(error);
        data.errorMessage = getErrorMessage(parseInt(error));
        data.distanciaCm = parseFloat(distanciaCm);
        data.nivelAguaCm = parseFloat(nivelAguaCm);
        data.porcentajeAgua = parseFloat(porcentajeAgua);
        data.lastUpdated = new Date().toISOString();

        // Respuesta exitosa
        answer.message = 'Data updated successfully via POST';
        answer.body = data;
        return res.status(200).json(answer);
    }
    catch(e) {
        console.error("Error al procesar POST /update:", e);
        errorResponse.message = 'Error interno del servidor: ' + e.message;
        return res.status(500).json(errorResponse);
    }
});

// Data - get
app.get('/data', (req, res) => {
    try {
        answer.message = 'Data retrieved successfully';
        // En esta ruta se añaden los sufijos (cm, %) para mostrar al usuario final
        const formattedData = {
             error: data.error,
             errorMessage: data.errorMessage,
             distanciaCm: data.distanciaCm + "cm",
             nivelAguaCm: data.nivelAguaCm + "cm",
             porcentajeAgua: data.porcentajeAgua + "%",
             lastUpdated: data.lastUpdated
        };
        answer.body = formattedData;
        return res.status(200).json(answer); 
    }
    catch(e) {
        console.error("Error al procesar GET /data:", e);
        errorResponse.message = 'Error al recuperar datos: ' + e.message;
        return res.status(500).json(errorResponse);
    }
});

// Raise server
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});