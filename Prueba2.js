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
    const boton = document.getElementById('botonMenu');
    const menu = document.getElementById('menuPrincipal');

    if (boton && menu) {
        boton.addEventListener('click', () => {
            menu.classList.toggle('activo');
            boton.classList.toggle('abierto');
        });
    }
});