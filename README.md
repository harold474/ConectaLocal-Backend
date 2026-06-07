Pipeline CI/CD configurado con GitHub Actions.
# ConectaLocal Backend

## Descripción del proyecto

ConectaLocal es una plataforma orientada a conectar productores locales con consumidores, permitiendo la publicación de productos, gestión de inventario, registro de usuarios, autenticación, pedidos, historial de compras, ventas, preguntas y respuestas, mensajería y administración del sistema.

Este repositorio contiene el backend del sistema, desarrollado con Node.js, Express y PostgreSQL. La API permite gestionar la lógica principal del sistema y expone endpoints para ser consumidos por el frontend o por clientes externos.

## Objetivo del sistema

El objetivo de ConectaLocal es facilitar la comercialización de productos locales mediante una solución digital que permita a productores publicar sus productos y a consumidores adquirirlos de forma organizada y segura.

## Tecnologías utilizadas

- Node.js
- Express.js
- PostgreSQL
- JavaScript
- JWT para autenticación
- bcrypt para cifrado de contraseñas
- Multer para carga de imágenes
- Jest para pruebas automatizadas
- Supertest para pruebas de endpoints
- GitHub Actions para CI/CD
- Render para despliegue en producción
- Docker y Docker Compose para configuración de entorno

## Arquitectura general del sistema

El backend está construido bajo una arquitectura basada en API REST. El sistema recibe solicitudes HTTP desde el cliente, procesa la lógica de negocio mediante Express, valida usuarios mediante JWT y se conecta a una base de datos PostgreSQL para almacenar y consultar la información.

Componentes principales:

- `index.js`: archivo principal del servidor Express.
- `db.js`: configuración de conexión a PostgreSQL.
- `middleware/validarToken.js`: middleware de autenticación JWT.
- `tests/`: carpeta con pruebas automatizadas.
- `Dockerfile`: configuración para construir la imagen del backend.
- `docker-compose.yml`: configuración para ejecutar backend y base de datos localmente.
- `.github/workflows/node.js.yml`: pipeline CI/CD con GitHub Actions.

## Requisitos previos

Antes de ejecutar el proyecto localmente se debe tener instalado:

- Node.js versión 20 o superior.
- PostgreSQL.
- Git.
- npm.

## Instalación local

1. Clonar el repositorio:

```bash
git clone https://github.com/harold474/ConectaLocal-Backend.git
