@echo off
color 0A
echo ===============================================================================
echo        Instalador de las herramientas para la base de Datos Supabase
echo ===============================================================================
echo.

if not exist "node_modules\" (
    echo Detectando primera vez... Instalando herramientas necesarias...
    echo Por favor, espera unos segundos.
    npm install
    echo.
)

echo Todo listo! El servidor esta encendido y conectado a la Base de Datos.
echo No cierres esta ventana negra. 
echo Ahora abre tu archivo "index.html" en el navegador para ver la pagina.
echo.

:: Enciende tu archivo server.js
node server.js
pause