/* Formulario de Fechas fijo y libre */
function cambiarSelectorFecha() {
    // Se indica el tipo de tour seleccionado por el usuario (grupal o privado)
    var tipoTour = document.getElementById("tipo-tour").value;
    
    // Obtenemos los dos contenedores de fechas que creamos en el HTML
    var cajaFechasFijas = document.getElementById("contenedor-fechas-fijas");
    var cajaFechaLibre = document.getElementById("contenedor-fecha-libre");

    // Condicional para mostrar u ocultar los contenedores según el tipo de tour seleccionado
    if (tipoTour === "grupal") {
        cajaFechasFijas.style.display = "block";
        cajaFechaLibre.style.display = "none";
    } else if (tipoTour === "privado") {
        cajaFechasFijas.style.display = "none";
        cajaFechaLibre.style.display = "block";
    }
}

// Esperar a que el DOM esté completamente cargado
// Esperamos a que la página cargue totalmente
document.addEventListener('DOMContentLoaded', () => {
    
    // Seleccionamos el botón y el menú por sus IDs
    const botonMenu = document.getElementById('botonMenu');
    const menuPrincipal = document.getElementById('menuPrincipal');

    // Si el botón existe, le agregamos la función de clic
    if (botonMenu && menuPrincipal) {
        botonMenu.addEventListener('click', () => {
            // "toggle" pone la clase 'activo' si no está, y la quita si ya está
            menuPrincipal.classList.toggle('activo');
            console.log("Menú clickeado"); // Esto es para que revises en consola si funciona
        });
    }
});