const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
    // 1. Leer el token que viene en los "Headers" de la petición
    const token = req.header('Authorization');

    // 2. Si no hay token, no lo dejamos pasar
    if (!token) {
        return res.status(403).json({ error: "Acceso denegado. No se proporcionó un token." });
    }

    try {
        // 3. Normalmente los tokens se envían con la palabra "Bearer " antes. Aquí separamos eso.
        const tokenLimpio = token.startsWith("Bearer ") ? token.split(" ")[1] : token;

        // 4. Verificamos que el token sea auténtico usando nuestra llave secreta
        const verificado = jwt.verify(tokenLimpio, process.env.JWT_SECRET);
        
        // 5. Extraemos el ID y rol del usuario y lo guardamos para usarlo en la ruta
        req.usuario = verificado; 
        
        // 6. ¡Todo en orden! Le damos paso a la siguiente función
        next(); 
    } catch (err) {
        res.status(401).json({ error: "Token no válido o expirado" });
    }
};