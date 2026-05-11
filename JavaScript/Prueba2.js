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
document.addEventListener("DOMContentLoaded", () => {
    const boton = document.getElementById("botonMenu");
    const menu = document.getElementById("menuPrincipal");
    const body = document.body;
    if (boton && menu) {
        boton.addEventListener("click", () => {
            menu.classList.toggle("activo");
            boton.classList.toggle("abierto");
            if (menu.classList.contains("activo")) {
                body.classList.add("no-scroll");
            } else {
                body.classList.remove("no-scroll");
            }
        });
    }
});

/* Formulario de Pago - Actualizado para Prueba2.css */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formularioPago');
    const btnPagar = document.getElementById('btnPagar');
    const textoBoton = document.getElementById('textoBoton');
    const spinner = document.getElementById('spinner');
    const modalExito = document.getElementById('modalExito');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // --- INICIO DE SIMULACIÓN DE CARGA ---
            btnPagar.disabled = true;
            textoBoton.textContent = 'Procesando...';
            
            // Mostramos el spinner quitando la clase 'oculto'
            spinner.classList.remove('oculto');

            // Simular delay de servidor (2 segundos)
            setTimeout(() => {
                // --- MOSTRAR ÉXITO ---
                
                // Quitamos 'oculto' para que el modal aparezca (usa flex por Prueba2.css)
                modalExito.classList.remove('oculto');
                
                // Reiniciar estado del botón
                btnPagar.disabled = false;
                textoBoton.textContent = 'Pagar Ahora';
                
                // Volvemos a ocultar el spinner con la clase
                spinner.classList.add('oculto');
            }, 2000);
        });
    }

    /* Formateo de número de tarjeta (espacios cada 4 dígitos) */
    const inputTarjeta = document.getElementById('tarjeta-numero');
    if (inputTarjeta) {
        inputTarjeta.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            let matches = v.match(/\d{4,16}/g);
            let match = matches && matches[0] || '';
            let parts = [];

            for (let i = 0, len = match.length; i < len; i += 4) {
                parts.push(match.substring(i, i + 4));
            }

            e.target.value = parts.length ? parts.join(' ') : v;
        });
    }

    /* Formateo de fecha de vencimiento (MM/AA) */
    const inputFecha = document.getElementById('tarjeta-fecha');
    if (inputFecha) {
        inputFecha.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            if (v.length >= 2) {
                e.target.value = v.substring(0, 2) + '/' + v.substring(2, 4);
            }
        });
    }
});

function Reservar() {
    // Aquí puedes añadir lógica extra antes de redireccionar
    window.location.href = "Pago.html";
}