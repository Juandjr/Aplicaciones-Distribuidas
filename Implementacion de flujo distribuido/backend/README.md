# 20. README.md

## Nombre del estudiante
Juan David Jiménez Romero

## Nombre del proyecto
Gestor de películas con autenticación OAuth, JWT y roles

## Descripción de la solución
Este proyecto implementa una aplicación web para gestionar películas, autenticar usuarios con Google OAuth, emitir y validar tokens JWT, controlar acceso por roles y simular alquileres/devoluciones. La solución está separada en backend y frontend, con persistencia en MySQL y registro de eventos mediante logs.

## Stack tecnológico
- Backend: Node.js + Express
- Frontend: HTML + CSS + JavaScript
- Autenticación: Passport.js + Google OAuth 2.0 + JWT
- Base de datos: MySQL
- Logs: Winston

## Base de datos seleccionada
MySQL, usando la base de datos `sakila` y tablas propias para la lógica de negocio:
- `movies`
- `movie_rentals`
- `users`
- `revoked_tokens`

## Requisitos previos
- Node.js instalado
- MySQL o XAMPP con MySQL en ejecución
- Una cuenta de Google Cloud con OAuth configurado
- Acceso a la base de datos `sakila`

## Estructura general del proyecto
```text
backend/
  server.js
  src/
    app.js
    db.js
    controllers/
    middleware/
    routes/
    scripts/
    services/
    utils/
frontend/
  public/
    css/
    js/
    index.html
    login.html
```

## Instrucciones de instalación
1. Clonar o abrir el proyecto en la carpeta deseada.
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Crear el archivo `.env` y completar las variables necesarias.
4. Crear las tablas necesarias:
   ```bash
   npm run create-app-tables
   ```

## Configuración de la base de datos
1. Asegurarse de que MySQL esté ejecutándose.
2. Verificar que exista la base de datos `sakila`.
3. Si es necesario, crearla con:
   ```sql
   CREATE DATABASE sakila;
   ```
4. La aplicación creará automáticamente las tablas necesarias al iniciar.

## Configuración de Google OAuth
1. Crear un proyecto en Google Cloud Console.
2. Habilitar la API de Google OAuth.
3. Configurar la pantalla de consentimiento.
4. Crear credenciales tipo OAuth 2.0 Client ID.
5. Agregar la URI de redirección:
   ```text
   http://localhost:3000/auth/google/callback
   ```
6. No publicar ni compartir credenciales reales.

## Variables de entorno
Agregar un archivo `.env` con las siguientes variables:
```env
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
JWT_SECRET=tu_secreto_jwt
JWT_EXPIRES_IN=1h
PORT=3000
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=sakila
ADMIN_EMAILS=correo@dominio.com
```

## Comandos de ejecución
Desde la carpeta del proyecto:
```bash
npm install
npm run create-app-tables
npm start
```

## Dirección del backend
- http://localhost:3000

## Dirección del cliente
- http://localhost:3000/login.html
- http://localhost:3000/index.html

## Roles implementados
- `Customer`: puede ver películas y realizar alquileres/devoluciones.
- `Admin`: puede crear, actualizar y desactivar películas.

## Instrucciones para probar el flujo
1. Abrir http://localhost:3000/login.html.
2. Iniciar sesión con Google.
3. Verificar que el dashboard muestre el usuario autenticado, el rol y el JWT parcialmente visible.
4. Probar:
   - acceso permitido con token
   - acceso rechazado sin token
   - acceso rechazado por rol
   - alquiler/devolución de una película
   - cierre de sesión
   - revocación del token
5. En el caso del rol Admin, comprobar que aparecen los formularios de administración.

## Notas importantes
- No compartir credenciales reales de Google ni secretos del `.env`.
- Los logs del sistema se registran en la carpeta `logs/` para facilitar la auditoría del flujo de autenticación y alquiler.

