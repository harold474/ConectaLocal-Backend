const { calcularTotal } = require('../logic'); 

test('si tengo 2 productos de $100, el resultado debe ser 200', () => {
    expect(calcularTotal(100, 2)).toBe(200);
});