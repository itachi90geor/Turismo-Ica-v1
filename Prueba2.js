/* Formulario de Fechas fijo y libre */
function cambiarSelectorFecha() {
    var tipoTour = document.getElementById("tipo-tour").value;
    var cajaFechasFijas = document.getElementById("contenedor-fechas-fijas");
    var cajaFechaLibre = document.getElementById("contenedor-fecha-libre");
    if (tipoTour === "grupal") {
        cajaFechasFijas.style.display = "block";
        cajaFechaLibre.style.display = "none";
    } else if (tipoTour === "privado") {
        cajaFechasFijas.style.display = "none";
        cajaFechaLibre.style.display = "block";
    }
}

/* Menú hamburguesa */
document.addEventListener('DOMContentLoaded', () => {
    const boton = document.getElementById('botonMenu');
    const menu = document.getElementById('menuPrincipal');
    const body = document.body;
    if (boton && menu) {
        boton.addEventListener('click', () => {
            menu.classList.toggle('activo');
            boton.classList.toggle('abierto');
            if (menu.classList.contains('activo')) {
                body.classList.add('no-scroll');
            } else {
                body.classList.remove('no-scroll');
            }
        });
    }
});