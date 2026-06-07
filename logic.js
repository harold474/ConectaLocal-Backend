// logic.js

/**
 * Calcula el valor total de un producto según su precio unitario y cantidad.
 *
 * Esta función se utiliza para obtener el subtotal de un producto dentro
 * de operaciones relacionadas con pedidos o cálculos de compra.
 *
 * @param {number} precio - Precio unitario del producto.
 * @param {number} cantidad - Cantidad de unidades seleccionadas.
 * @returns {number} Resultado de multiplicar el precio por la cantidad.
 *
 * @example
 * const total = calcularTotal(5000, 3);
 * console.log(total); // 15000
 */
const calcularTotal = (precio, cantidad) => {
    return precio * cantidad;
};

// Exportamos usando CommonJS, el mismo formato utilizado en index.js
module.exports = { calcularTotal };