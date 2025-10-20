'use strict'

const jwt = require('jsonwebtoken'); // Importamos JSON Web Token

// **********************************************
// CONFIGURACIÓN DE SEGURIDAD JWT
// **********************************************
// CRÍTICO: Leer la clave secreta desde las variables de entorno
const JWT_SECRET = process.env.JWT_SECRET;
const DEVICE_ID = process.env.DEVICE_ID; // ID de dispositivo para el payload JWT

// Verificar que la clave secreta esté cargada
if (!JWT_SECRET) {
    console.error("ERROR CRÍTICO: La variable de entorno JWT_SECRET no está definida.");
    console.error("Por favor, define JWT_SECRET (ej: JWT_SECRET='tu_clave_secreta') antes de iniciar el servidor.");
    process.exit(1); // Detener la aplicación si la clave no existe
}

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

// ------------------------------------------------------------------
// RUTA PÚBLICA: Obtener Credenciales (Token JWT)
// El ESP8266 hará un GET a esta ruta para obtener su token.
// ------------------------------------------------------------------
const getCredentials = (req, res) => {
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
};

module.exports = {
    verifyToken,
    getCredentials
};