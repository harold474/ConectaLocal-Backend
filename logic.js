// logic.js

const calcularTotal = (precio, cantidad) => {
    return precio * cantidad;
};

// Exportamos usando CommonJS (es el formato estándar de tu index.js)
module.exports = { calcularTotal };