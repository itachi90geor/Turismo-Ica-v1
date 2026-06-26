/* ==========================================
   1. SISTEMA DE PAGO (CONECTADO A SUPABASE)
========================================== */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formularioPago');
    const btnPagar = document.getElementById('btnPagar');
    const textoBoton = document.getElementById('textoBoton');
    const spinner = document.getElementById('spinner');
    
    const btnEfectivo = document.getElementById('btnEfectivo');
    const textoBotonEfectivo = document.getElementById('textoBotonEfectivo');
    const spinnerEfectivo = document.getElementById('spinnerEfectivo');
    
    const modalExito = document.getElementById('modalExito');

    // Función maestra que se comunica con el Backend
    async function registrarReservaBD(metodo_pago, estado) {
        const idUsuario = sessionStorage.getItem("idUsuario");
        
        if (!idUsuario) {
            alert("¡Hola! Por favor, inicia sesión con tu cuenta para completar la reserva.");
            window.location.href = "../Login.html";
            return false;
        }

        const memoria = sessionStorage.getItem('ordenTurismoIca');
        if (!memoria) {
            alert("No se encontraron los datos de la orden.");
            return false;
        }
        
        const orden = JSON.parse(memoria);

        try {
            const res = await fetch('http://localhost:3000/api/reservas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usuario_id: idUsuario,
                    destino_id: orden.id,
                    modalidad: orden.modalidad,
                    fecha_reserva: orden.fecha,
                    pasajeros: orden.pasajeros,
                    total: orden.total,
                    metodo_pago: metodo_pago,
                    estado: estado
                })
            });
            
            if(res.ok) {
                return true;
            } else {
                const err = await res.json();
                alert("Ocurrió un error al procesar tu reserva: " + err.error);
                return false;
            }
        } catch (error) {
            console.error("Error de red al registrar:", error);
            alert("Error de conexión con el servidor.");
            return false;
        }
    }

    // --- LÓGICA PARA TARJETA ---
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            btnPagar.disabled = true;
            textoBoton.textContent = 'Procesando Pago...';
            spinner.classList.remove('oculto');

            // Enviamos "tarjeta" y estado "confirmado"
            const exito = await registrarReservaBD('tarjeta', 'confirmado');

            if (exito) {
                modalExito.querySelector('h3').textContent = '¡Pago Realizado!';
                modalExito.querySelector('p').textContent = 'Tu reserva ha sido confirmada con éxito.';
                modalExito.classList.remove('oculto');
            }
            
            btnPagar.disabled = false;
            textoBoton.textContent = 'Pagar Ahora';
            spinner.classList.add('oculto');
        });
    }

    // --- LÓGICA PARA EFECTIVO / YAPE ---
    if (btnEfectivo) {
        btnEfectivo.addEventListener('click', async () => {
            btnEfectivo.disabled = true;
            textoBotonEfectivo.textContent = 'Generando código...';
            spinnerEfectivo.classList.remove('oculto');

            // Enviamos "efectivo" y estado "pendiente"
            const exito = await registrarReservaBD('efectivo', 'pendiente');

            if (exito) {
                modalExito.querySelector('h3').textContent = '¡Reserva Registrada!';
                modalExito.querySelector('p').textContent = 'Tu código de pago ha sido generado. Revisa tu correo o págala desde tu app móvil.';
                modalExito.classList.remove('oculto');
            }

            btnEfectivo.disabled = false;
            textoBotonEfectivo.textContent = 'Obtener Código de Pago';
            spinnerEfectivo.classList.add('oculto');
        });
    }

    /* Formateo de número de tarjeta y fecha (Se mantiene igual) */
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
    window.location.href = "Pago.html";
}

/* ==========================================
   2. FILTROS DE DESTINOS (¡NO TOCADO!)
========================================== */
function inicializarLógicaFiltros() {
    const botonesFiltro = document.querySelectorAll('.btn-filtro');
    const tarjetasViaje = document.querySelectorAll('.cuadrito-viaje');

    if (botonesFiltro.length > 0 && tarjetasViaje.length > 0) {
        botonesFiltro.forEach(boton => {
            boton.addEventListener('click', () => {
                botonesFiltro.forEach(btn => btn.classList.remove('activo'));
                boton.classList.add('activo');
                const filtroElegido = boton.getAttribute('data-filtro');
                tarjetasViaje.forEach(tarjeta => {
                    const categoriaTarjeta = tarjeta.getAttribute('data-categoria');
                    if (filtroElegido === 'todos' || filtroElegido === categoriaTarjeta) {
                        tarjeta.classList.remove('oculto');
                    } else {
                        tarjeta.classList.add('oculto');
                    }
                });
            });
        });
    }
}

/* ==========================================
   3. VIGILANTE DE SESIÓN (¡CORREGIDO!)
========================================== */
document.addEventListener('DOMContentLoaded', () => {
    const usuarioActivo = sessionStorage.getItem('usuarioLogueado');
    const rolActivo = sessionStorage.getItem('rolUsuario');
    const iconoPerfil = document.querySelector('.enlace-perfil-usuario');
    const menuPrincipalUl = document.querySelector('#menuPrincipal ul');

    if (usuarioActivo && iconoPerfil) {
        let primerNombre = usuarioActivo.split(' ')[0];

        // Verificamos si estamos dentro de la carpeta Detalles viendo la URL actual
        const esSubcarpeta = window.location.pathname.includes('/Detalles/');
        const rutaPerfil = esSubcarpeta ? '../Perfil.html' : 'Perfil.html';
        const rutaAdmin = esSubcarpeta ? '../Admin.html' : 'Admin.html';

        // FORZAMOS EL LINK AL PERFIL
        iconoPerfil.setAttribute('href', rutaPerfil);
        iconoPerfil.style.color = '#e63946';
        iconoPerfil.style.fontWeight = 'bold';
        iconoPerfil.innerHTML = `<i class="fa-solid fa-user"></i> ${primerNombre}`;

        // Panel Admin si es administrador (validamos "admin" de forma segura)
        if (rolActivo && rolActivo.trim().toLowerCase() === 'admin' && menuPrincipalUl) {
            // Evitamos duplicar el botón si ya existe
            if (!document.getElementById('link-panel-admin')) {
                const liAdmin = document.createElement('li');
                liAdmin.id = 'link-panel-admin';
                liAdmin.innerHTML = `<a href="${rutaAdmin}" style="color: #e63946; font-weight: 800;"><i class="fa-solid fa-shield-halved"></i> PANEL ADMIN</a>`;
                menuPrincipalUl.appendChild(liAdmin);
            }
        }
    } else if (iconoPerfil) {
        const esSubcarpeta = window.location.pathname.includes('/Detalles/');
        iconoPerfil.setAttribute('href', esSubcarpeta ? '../Login.html' : 'Login.html');
    }
});

/* ==========================================
   4. SISTEMA DE LOGIN Y REGISTRO (¡CORREGIDO!)
========================================== */
document.addEventListener('submit', (e) => {
    const titulo = document.title;

    // --- LÓGICA DE LOGIN ---
    if (titulo.includes('Login') || titulo.includes('Ingresar')) {
        e.preventDefault();
        const datosLogin = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };

        fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosLogin)
        })
            .then(res => res.json())
            .then(data => {
                if (data.mensaje || data.usuario) {
                    // Doble validación para atrapar el rol ya sea que venga como data.rol o data.role
                    const rolDelUsuario = data.rol || data.role || 'user';

                    sessionStorage.setItem('usuarioLogueado', data.usuario);
                    sessionStorage.setItem('idUsuario', data.idUsuario);
                    sessionStorage.setItem('rolUsuario', rolDelUsuario);

                    alert("¡Bienvenido, " + data.usuario + "!");
                    window.location.href = 'Perfil.html';
                } else {
                    alert("Error: " + data.error);
                }
            })
            .catch((err) => {
                console.error(err);
                alert("Error: No se pudo conectar con el servidor.");
            });
    }

    // --- LÓGICA DE REGISTRO ---
    if (titulo.includes('Registro')) {
        e.preventDefault();
        const datosUsuario = {
            nombre: document.getElementById('nombre').value,
            telefono: document.getElementById('telefono').value,
            dni: document.getElementById('dni').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };

        fetch('http://localhost:3000/api/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosUsuario)
        })
            .then(res => res.json())
            .then(data => {
                alert(data.mensaje || data.error);
                if (!data.error) window.location.href = 'Login.html';
            });
    }
});

// ============================================================================
// 5. OTROS: CATÁLOGO, MENÚ, CERRAR SESIÓN (MODIFICADO CON FAVORITOS)
// ============================================================================
async function cargarCatalogoDestinos() {
    try {
        const respuesta = await fetch('http://localhost:3000/api/destinos');
        const destinos = await respuesta.json();
        
        const contenedor = document.getElementById('contenedor-destinos');
        if (!contenedor) return;

        const idUsuario = sessionStorage.getItem("idUsuario");
        let misFavoritos = [];
        
        // SALVAVIDAS: Si el servidor falla al traer favoritos, no rompe el catálogo
        if (idUsuario) {
            try {
                const resFavs = await fetch(`http://localhost:3000/api/favoritos/ids/${idUsuario}`);
                if (resFavs.ok) {
                    const dataFavs = await resFavs.json();
                    if (Array.isArray(dataFavs)) {
                        misFavoritos = dataFavs;
                    }
                }
            } catch (errFav) {
                console.warn("Modo offline para favoritos, cargando catálogo normal.");
            }
        }

        contenedor.innerHTML = '';
        destinos.forEach(destino => {
            const card = document.createElement('div');
            card.className = 'cuadrito-viaje'; 
            card.setAttribute('data-categoria', destino.categoria);

            const esFav = misFavoritos.includes(destino.id);
            const claseActiva = esFav ? 'activo' : '';
            const iconoClase = esFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart';

            // --- LÓGICA DE DESCUENTOS ---
            let htmlEtiquetaDescuento = '';
            let htmlPreciosGrupal = `<strong>S/ ${destino.precio_grupal}</strong>`;
            let htmlPreciosPrivado = `<strong style="color: var(--color-boton);">S/ ${destino.precio_privado}</strong>`;

            // Si el tour tiene descuento activado y el porcentaje es mayor a 0
            if (destino.con_descuento && destino.porcentaje_descuento > 0) {
                // Matemáticas: Precio - (Precio * Porcentaje / 100)
                let precioGrupalDescuento = (destino.precio_grupal - (destino.precio_grupal * destino.porcentaje_descuento / 100)).toFixed(2);
                let precioPrivadoDescuento = (destino.precio_privado - (destino.precio_privado * destino.porcentaje_descuento / 100)).toFixed(2);

                htmlEtiquetaDescuento = `<span class="etiqueta-descuento">-${destino.porcentaje_descuento}% OFF</span>`;
                
                htmlPreciosGrupal = `
                    <div class="contenedor-precio-descuento">
                        <span class="precio-antiguo">S/ ${destino.precio_grupal}</span>
                        <strong>S/ ${precioGrupalDescuento}</strong>
                    </div>`;
                    
                htmlPreciosPrivado = `
                    <div class="contenedor-precio-descuento">
                        <span class="precio-antiguo">S/ ${destino.precio_privado}</span>
                        <strong style="color: var(--color-boton);">S/ ${precioPrivadoDescuento}</strong>
                    </div>`;
            }
            // ----------------------------

            card.innerHTML = `
                <div class="cuadrito-viaje-imagen-wrapper">
                    ${htmlEtiquetaDescuento} <!-- Si no hay descuento, esto estará vacío -->
                    
                    <button class="btn-corazon-catalogo ${claseActiva}" onclick="manejarFavoritoClick(event, this, ${destino.id})">
                        <i class="${iconoClase}"></i>
                    </button>
                    
                    <a href="Detalles/Detalle.html?id=${destino.id}" class="enlace-tarjeta-bloque">
                        <figure><img src="${destino.imagen_url}" class="foto-del-viaje" alt="${destino.titulo}"></figure>
                    </a>
                </div>
                
                <a href="Detalles/Detalle.html?id=${destino.id}" class="enlace-tarjeta-bloque">
                    <div class="textos-del-viaje">
                        <h3>${destino.titulo}</h3>
                        <p>${destino.descripcion_corta}</p>
                        <div class="caja-de-precios">
                            <div class="opcion-de-precio">
                                <span>Grupal</span>
                                ${htmlPreciosGrupal}
                            </div>
                            <div class="linea-vertical-precios"></div>
                            <div class="opcion-de-precio privado">
                                <span>Privado</span>
                                ${htmlPreciosPrivado}
                            </div>
                        </div>
                    </div>
                </a>
            `;
            contenedor.appendChild(card);
        });
        inicializarLógicaFiltros();
    } catch (error) { 
        console.error("Error al cargar el catálogo:", error); 
    }
}

async function manejarFavoritoClick(event, botonHtml, destinoId) {
    event.stopPropagation();
    event.preventDefault();

    const idUsuario = sessionStorage.getItem("idUsuario"); 

    if (!idUsuario) {
        alert("¡Hola! Para guardar este destino en tus favoritos debes crear una cuenta primero.");
        window.location.href = "Registro.html";
        return;
    }

    const icono = botonHtml.querySelector('i');
    
    try {
        // Le enviamos la instrucción al Backend para que guarde o borre el favorito
        const res = await fetch('http://localhost:3000/api/favoritos/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: idUsuario, destino_id: destinoId })
        });
        const data = await res.json();

        // Cambiamos el color según la respuesta directa del servidor
        if (data.esFavorito) {
            botonHtml.classList.add('activo');
            icono.className = 'fa-solid fa-heart'; 
        } else {
            botonHtml.classList.remove('activo');
            icono.className = 'fa-regular fa-heart'; 
        }
    } catch (error) {
        console.error("Error de conexión al guardar favorito:", error);
    }
}

if (document.getElementById('contenedor-destinos')) cargarCatalogoDestinos();

// === NUEVA FUNCIÓN EVALUADORA DE SESIÓN PARA FAVORITOS (AÑADIDA) ===


/* Menú hamburguesa */
document.addEventListener("DOMContentLoaded", () => {
    const boton = document.getElementById("botonMenu");
    const menu = document.getElementById("menuPrincipal");
    if (boton && menu) {
        boton.addEventListener("click", () => {
            menu.classList.toggle("activo");
            boton.classList.toggle("abierto");
            document.body.classList.toggle("no-scroll");
        });
    }
});

/* Selector de Fechas */
/* Selector de Fechas y Actualización de Precios Dinámica */
function cambiarSelectorFecha() {
    var tipoTour = document.getElementById("tipo-tour").value;
    var cajaFechasFijas = document.getElementById("contenedor-fechas-fijas");
    var cajaFechaLibre = document.getElementById("contenedor-fecha-libre");

    // 1. Cambiar visibilidad de los calendarios
    if (cajaFechasFijas && cajaFechaLibre) {
        cajaFechasFijas.style.display = (tipoTour === "grupal") ? "block" : "none";
        cajaFechaLibre.style.display = (tipoTour === "privado") ? "block" : "none";
    }

    // 2. Actualizar el precio dinámicamente según la elección
    const d = window.dataTourGlobal; // Leemos el tour que guardamos en memoria al cargar la página
    if (!d) return; 

    // Elegimos qué tarifa usar
    let precioBase = (tipoTour === "privado") ? d.precio_privado : d.precio_grupal;
    let htmlPrecio = `Desde <strong>S/ ${precioBase}</strong>`;

    // Si tiene descuento, le aplicamos la matemática a la tarifa elegida
    if (d.con_descuento && d.porcentaje_descuento > 0) {
        let precioRebajado = (precioBase - (precioBase * d.porcentaje_descuento / 100)).toFixed(2);
        
        htmlPrecio = `
            Desde <span style="text-decoration: line-through; color: #999; font-size: 0.9em;">S/ ${precioBase}</span> 
            <strong style="color: var(--color-boton); font-size: 1.3em; margin-left: 5px;">S/ ${precioRebajado}</strong>
            <span style="background: var(--color-boton); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8em; margin-left: 8px; vertical-align: middle;">-${d.porcentaje_descuento}%</span>
        `;
    }
    
    // Inyectamos el nuevo HTML en la etiqueta del precio
    const labelDesde = document.getElementById("label-desde");
    if (labelDesde) {
        labelDesde.innerHTML = htmlPrecio;
    }
}

/* Función Maestra de Cerrar Sesión */
function cerrarSesion() {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = 'index.html';
}

/* ==========================================
   6. SISTEMA DETALLE DEL TOUR (DINÁMICO)
========================================== */
document.addEventListener("DOMContentLoaded", async () => {
    // Verificamos si estamos específicamente en la pantalla de detalle para evitar errores de consola
    const tituloDestinoEl = document.getElementById("titulo-destino");
    if (!tituloDestinoEl) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        window.location.href = "../Destino.html";
        return;
    }

    try {
        // 1. Pedimos los datos del destino al servidor
        const res = await fetch(`http://localhost:3000/api/destinos/${id}`);
        const d = await res.json();

        // 2. Población de datos básicos y diseño
        document.title = `${d.titulo} | Turismo Ica`;
        tituloDestinoEl.innerText = d.titulo;
        document.getElementById("descripcion-larga").innerText = d.descripcion_larga;
        // --- LÓGICA PARA MOSTRAR PRECIO Y DESCUENTO EN EL FORMULARIO ---
        let htmlPrecio = `Desde <strong>S/ ${d.precio_grupal}</strong>`;

        if (d.con_descuento && d.porcentaje_descuento > 0) {
            let precioRebajado = (d.precio_grupal - (d.precio_grupal * d.porcentaje_descuento / 100)).toFixed(2);
            
            htmlPrecio = `
                Desde <span style="text-decoration: line-through; color: #999; font-size: 0.9em;">S/ ${d.precio_grupal}</span> 
                <strong style="color: var(--color-boton); font-size: 1.3em; margin-left: 5px;">S/ ${precioRebajado}</strong>
                <span style="background: var(--color-boton); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8em; margin-left: 8px; vertical-align: middle;">-${d.porcentaje_descuento}%</span>
            `;
        }
        
        document.getElementById("label-desde").innerHTML = htmlPrecio;
        window.dataTourGlobal = d;
        // -------------------------------------------------------------

        // Fondo de portada dinámico
        document.getElementById("portada-fondo").style.backgroundImage =
            `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${d.imagen_url})`;

        // 3. Link dinámico para "Más Información"
        const cleanName = d.titulo.split(" ").pop();
        document.getElementById("link-mas-info").href = `../Informacion/Info_${cleanName}.html`;

        // 4. Cargar Días Programados dinámicamente
        const selectDias = document.querySelector("#contenedor-fechas-fijas select");
        if (d.dias_programados && selectDias) {
            selectDias.innerHTML = "";
            const listaDias = d.dias_programados.split(",");

            listaDias.forEach((dia) => {
                const textoDia = dia.trim();
                if (textoDia) {
                    const option = document.createElement("option");
                    option.text = textoDia;
                    option.value = textoDia.toLowerCase().replace(/\s+/g, "-");
                    selectDias.add(option);
                }
            });
        }

        // 5. Galería de Imágenes (Diseño de 4 fotos)
        const galeria = document.getElementById("galeria-fotos");
        if (d.imagenes_destino) {
            d.imagenes_destino.forEach((img) => {
                const el = document.createElement("img");
                el.src = img.url;
                el.alt = d.titulo;
                galeria.appendChild(el);
            });
        }

        // 6. Comentarios con diseño de borde rojo
        const contenedorComentarios = document.getElementById("contenedor-comentarios");
        if (d.comentarios && d.comentarios.length > 0) {
            contenedorComentarios.innerHTML = "";
            d.comentarios.forEach((c) => {
                contenedorComentarios.innerHTML += `
                    <div class="cuadro-opinion-cliente">
                        <h4>${c.usuarios.nombre}</h4>
                        <p>${c.texto}</p>
                    </div>`;
            });
        } else {
            contenedorComentarios.innerHTML = '<p class="cuadro-opinion-cliente">No hay comentarios aún. ¡Sé el primero!</p>';
        }

        // --- LÓGICA DE COMENTARIOS PARA USUARIOS ---
        const idActivo = sessionStorage.getItem("idUsuario");
        const cajaComentario = document.getElementById("seccion-postear-comentario");

        if (idActivo) {
            cajaComentario.innerHTML = `
                <h3>Deja tu opinión</h3>
                <textarea id="texto-nuevo-comentario" class="textarea-comentario" placeholder="¿Qué te pareció este tour?" rows="3"></textarea>
                <button onclick="enviarComentario(${id})" class="boton-rojo-ingresar boton-comentario-publicar">
                    Publicar Comentario
                </button>
            `;
        } else {
            cajaComentario.innerHTML = `
                <p class="caja-comentario-visitante"><strong>¿Quieres comentar?</strong> <a href="../Login.html" class="enlace-login-comentario">Inicia sesión aquí</a> para compartir tu experiencia.</p>
            `;
        }

    } catch (error) {
        console.error("Error al cargar el tour dinámico:", error);
    }
});

// Función global expuesta para procesar el envío de comentarios
window.enviarComentario = async (destinoId) => {
    const texto = document.getElementById("texto-nuevo-comentario").value;
    if (!texto.trim()) return alert("Escribe un comentario primero.");

    try {
        const res = await fetch("http://localhost:3000/api/comentarios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                destino_id: destinoId,
                usuario_id: sessionStorage.getItem("idUsuario"),
                texto: texto,
                estrellas: 5,
            }),
        });

        if (res.ok) {
            alert("¡Gracias por tu comentario!");
            location.reload();
        }
    } catch (error) {
        console.error("Error al enviar comentario:", error);
    }
};

/* ==========================================
   7. SISTEMA DE GESTIÓN DEL PANEL ADMIN
========================================== */

// Este bloque inicializa las funciones del panel solo si el contenedor del admin existe en pantalla
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("contenedor-principal")) {
        mostrarSeccion("usuarios");
    }
});

// 1. CAMBIO DE PESTAÑAS (USUARIOS / DESTINOS / RESERVAS)
function mostrarSeccion(seccion) {
    document
        .querySelectorAll(".nav-sidebar a")
        .forEach((a) => a.classList.remove("activo"));

    const botonPestaña = document.getElementById(`btn-${seccion}`);
    if (botonPestaña) botonPestaña.classList.add("activo");

    const contenedor = document.getElementById("contenedor-principal");
    if (!contenedor) return;

    contenedor.innerHTML = "<h2>Cargando información...</h2>";

    if (seccion === "usuarios") {
        cargarUsuarios();
    } else if (seccion === "destinos") {
        cargarDestinos();
    } else if (seccion === "reservas") {
        contenedor.innerHTML =
            "<h2>Gestión de Reservas</h2><p>Módulo en desarrollo para el Grupo 6.</p>";
    }
}

// 2. CARGAR LISTA DE USUARIOS DESDE LA API
async function cargarUsuarios() {
    try {
        const res = await fetch("http://localhost:3000/api/admin/usuarios");
        const usuarios = await res.json();
        const contenedor = document.getElementById("contenedor-principal");
        if (!contenedor) return;

        contenedor.innerHTML = `
      <h2>Gestión de Usuarios</h2>
      <table class="cuadro-estilo-excel">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="listaUsuarios"></tbody>
      </table>`;

        const tbody = document.getElementById("listaUsuarios");
        usuarios.forEach((u) => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
        <td>${u.nombre}</td>
        <td>${u.email}</td>
        <td><strong>${u.rol.toUpperCase()}</strong></td>
        <td><span class="${u.activo ? "confirmado" : "pastilla-roja-estado"}">${u.activo ? "ACTIVO" : "BANEADO"}</span></td>
        <td><button onclick="cambiarEstadoUsuario(${u.id}, ${!u.activo})" class="btn-detalles">${u.activo ? "Desactivar" : "Activar"}</button></td>`;
            tbody.appendChild(fila);
        });
    } catch (e) {
        console.error("Error al cargar usuarios de la administración:", e);
    }
}

// 3. CARGAR LISTA DE DESTINOS (Líneas rectangulares)
async function cargarDestinos() {
    try {
        const res = await fetch("http://localhost:3000/api/admin/destinos");
        const destinos = await res.json();
        const contenedor = document.getElementById("contenedor-principal");
        if (!contenedor) return;

        contenedor.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="margin: 0;">Gestión de Destinos</h2>
          <button class="btn-detalles" onclick="abrirCreadorDestino()" style="background-color: #e51d2a; color: white; border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: bold; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-plus"></i> Añadir Ruta
          </button>
        </div>
        <div id="listaDestinos"></div>`;
        
        const lista = document.getElementById("listaDestinos");

        destinos.forEach((d) => {
            const card = document.createElement("div");
            card.className = "linea-rectangular-destino";
            
            // Si está deshabilitado, aplicamos opacidad al contenedor base
            if (d.activo === false) {
                card.style.opacity = "0.6";
                card.style.borderLeft = "5px solid #535353"; 
            }

            card.innerHTML = `
        <div class="info-basica">
          <img src="${d.imagen_url}" style="width: 80px; height: 50px; object-fit: cover; border-radius: 8px;">
          <div>
            <h4>${d.titulo} ${d.activo ? "" : ' <span style="color: #e51d2a; font-size: 0.8rem; font-weight: bold;">(DESHABILITADO)</span>'}</h4>
            <p>Precio: S/ ${d.precio_grupal}</p>
          </div>
        </div>
        <div class="controles-admin">
          <label class="switch-descuento"><input type="checkbox" ${d.con_descuento ? "checked" : ""} onchange="toggleDescuento(${d.id}, this.checked)"> Descuento</label>
          
          <button class="btn-detalles" onclick="abrirEditorDestino(${d.id})"><i class="fa-solid fa-pen-to-square"></i> Editar</button>
          
          <button class="btn-detalles" onclick="cambiarEstadoDestino(${d.id}, ${!d.activo})">
              <i class="fa-solid ${d.activo ? 'fa-eye-slash' : 'fa-eye'}"></i> ${d.activo ? "Deshabilitar" : "Habilitar"}
          </button>
        </div>`;
            lista.appendChild(card);
        });
    } catch (e) {
        console.error("Error al cargar destinos en administración:", e);
    }
}

function abrirCreadorDestino() {
    document.getElementById("edit-id").value = ""; // ID vacío avisa que es un registro nuevo
    document.getElementById("tituloEditor").innerText = "Añadir Nueva Ruta de Destino";
    document.getElementById("formEditor").reset(); // Limpia los inputs

    // Limpiamos las cajas de la galería de fotos
    for (let i = 1; i <= 4; i++) {
        const input = document.getElementById(`img-galeria-${i}`);
        if (input) input.value = "";
    }

    const modal = document.getElementById("modalEditor");
    if (modal) {
        modal.classList.remove("oculto");
        modal.style.display = "flex";
    }
}

// 4. LÓGICA DE APERTURA DEL MODAL EDITOR
async function abrirEditorDestino(id) {
    try {
        const res = await fetch(`http://localhost:3000/api/destinos/${id}`);
        const d = await res.json();

        document.getElementById("edit-id").value = d.id;
        document.getElementById("tituloEditor").innerText = "Editar Destino";
        document.getElementById("edit-titulo").value = d.titulo;
        document.getElementById("edit-dias").value = d.dias_programados || "";
        document.getElementById("edit-precio-grupal").value = d.precio_grupal;
        document.getElementById("edit-precio-privado").value = d.precio_privado;
        document.getElementById("edit-descripcion-corta").value = d.descripcion_corta || "";
        document.getElementById("edit-descripcion").value = d.descripcion_larga;
        document.getElementById("edit-imagen").value = d.imagen_url;
        document.getElementById("edit-porcentaje").value = d.porcentaje_descuento || 0;
        document.getElementById("edit-ubicacion").value = d.ubicacion || "";

        if (d.imagenes_destino) {
            d.imagenes_destino.forEach((img, index) => {
                const input = document.getElementById(`img-galeria-${index + 1}`);
                if (input) input.value = img.url;
            });
        }

        const modal = document.getElementById("modalEditor");
        if (modal) {
            modal.classList.remove("oculto");
            modal.style.display = "flex";
        }
    } catch (e) {
        alert("Error al cargar los detalles del destino.");
    }
}

// 5. CERRAR MODAL EDITOR
function cerrarEditor() {
    const modal = document.getElementById("modalEditor");
    if (modal) {
        modal.classList.add("oculto");
        modal.style.display = "none";
    }
}

// 6. ESCUCHADOR GLOBAL PARA GUARDAR CAMBIOS (Asegura que funcione si el formulario existe)
document.addEventListener("submit", async (e) => {
    if (e.target && e.target.id === "formEditor") {
        e.preventDefault();
        const id = document.getElementById("edit-id").value;

        const imagenes_galeria = [
            document.getElementById("img-galeria-1").value,
            document.getElementById("img-galeria-2").value,
            document.getElementById("img-galeria-3").value,
            document.getElementById("img-galeria-4").value,
        ].filter((url) => url.trim() !== "");

        // Asignación de categoría automática para que funcione el filtro dinámico
        const tituloTexto = document.getElementById("edit-titulo").value.toLowerCase();
        let catAsignada = 'cultura';
        if (tituloTexto.includes('oasis') || tituloTexto.includes('duna') || tituloTexto.includes('sandboard') || tituloTexto.includes('tubular')) {
            catAsignada = 'aventura';
        } else if (tituloTexto.includes('reserva') || tituloTexto.includes('laguna') || tituloTexto.includes('cañón') || tituloTexto.includes('oasis')) {
            catAsignada = 'naturaleza';
        }

        const datos = {
            titulo: document.getElementById("edit-titulo").value,
            precio_grupal: document.getElementById("edit-precio-grupal").value,
            dias_programados: document.getElementById("edit-dias").value,
            precio_privado: document.getElementById("edit-precio-privado").value,
            descripcion_corta: document.getElementById("edit-descripcion-corta").value,
            descripcion_larga: document.getElementById("edit-descripcion").value,
            imagen_url: document.getElementById("edit-imagen").value,
            porcentaje_descuento: document.getElementById("edit-porcentaje").value,
            ubicacion: document.getElementById("edit-ubicacion").value,
            imagenes_galeria: imagenes_galeria,
            categoria: catAsignada
        };

        try {
            // LÓGICA ALGORÍTMICA: Si el ID está vacío usamos POST (crear), si existe usamos PUT (actualizar)
            const esNuevo = (id === "");
            const urlTerminal = esNuevo ? 'http://localhost:3000/api/admin/destinos' : `http://localhost:3000/api/admin/destinos/${id}`;
            const metodoHttp = esNuevo ? 'POST' : 'PUT';

            const res = await fetch(urlTerminal, {
                method: metodoHttp,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datos),
            });

            if (res.ok) {
                alert(esNuevo ? "¡Nueva ruta añadida exitosamente!" : "¡Información actualizada con éxito!");
                cerrarEditor();
                cargarDestinos(); // Recarga la lista dinámicamente
            } else {
                alert("Ocurrió un inconveniente al procesar la solicitud.");
            }
        } catch (err) {
            console.error("Error en la petición de administración:", err);
        }
    }
});

// 7. ENVIAR CAMBIOS DE ESTADO DE USUARIO (ACTIVAR/BANEAR)
async function cambiarEstadoDestino(id, nuevoEstado) {
    const confirmacion = confirm(`¿Estás seguro de que deseas ${nuevoEstado ? 'habilitar' : 'deshabilitar'} esta ruta turística?`);
    if (!confirmacion) return;

    try {
        const res = await fetch("http://localhost:3000/api/admin/destinos/estado", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, activo: nuevoEstado }),
        });

        if (res.ok) {
            cargarDestinos(); // Recargamos la lista en tiempo real para ver el cambio estético
        } else {
            alert("No se pudo modificar el estatus de la ruta.");
        }
    } catch (e) {
        console.error("Error al cambiar estado de la ruta:", e);
    }
}

async function toggleDescuento(id, estado) {
    try {
        await fetch(`http://localhost:3000/api/admin/destinos/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ con_descuento: estado }),
        });
    } catch (e) { console.error(e); }
}

// =========================================================
// FUNCIÓN PARA PINTAR LOS FAVORITOS EN LA PESTAÑA DEL PERFIL
// =========================================================
window.cargarFavoritosUsuario = async function(idUsuario) {
    const contenedor = document.getElementById('contenedor-favoritos-dinamicos');
    if (!contenedor) return;
    
    contenedor.innerHTML = '<p style="color: #666;">Cargando tus destinos preferidos...</p>';

    try {
        const res = await fetch(`http://localhost:3000/api/favoritos/usuario/${idUsuario}`);
        const favoritos = await res.json();

        if (favoritos.length === 0) {
            contenedor.innerHTML = '<p style="color: #666; grid-column: 1 / -1;">Aún no tienes destinos guardados. ¡Ve al catálogo y elige tus próximos viajes dándole al corazón!</p>';
            return;
        }

        contenedor.innerHTML = ''; // Limpiamos el mensaje de "Cargando"
        
        favoritos.forEach(fav => {
            const destino = fav.destinos;
            if(!destino) return; // Si por alguna razón el destino fue borrado de la base de datos
            
            const card = document.createElement('div');
            card.className = 'card-favorito';
            card.innerHTML = `
                <div class="imagen-favorito">
                    <!-- Al quitar el corazón desde el perfil, la página se recarga suavemente para desaparecer la tarjeta -->
                    <button class="btn-corazon" onclick="manejarFavoritoClick(event, this, ${destino.id}); setTimeout(() => cargarFavoritosUsuario(${idUsuario}), 200);">
                        <i class="fa-solid fa-heart"></i>
                    </button>
                    <a href="Detalles/Detalle.html?id=${destino.id}">
                        <img src="${destino.imagen_url}" alt="${destino.titulo}">
                    </a>
                </div>
                <div style="padding: 15px;">
                    <h4 style="margin-bottom: 5px; color: #1a1a1a;">${destino.titulo}</h4>
                    <p style="color: #e51d2a; font-weight: bold;">Desde S/ ${destino.precio_grupal}</p>
                </div>
            `;
            contenedor.appendChild(card);
        });
    } catch (error) {
        console.error("Error al cargar favoritos en el perfil:", error);
        contenedor.innerHTML = '<p style="color: #e51d2a;">Ocurrió un error al cargar tus favoritos.</p>';
    }
};

/* ================================================= */
/* PASO 1: MANDAR DATOS DE RESERVA A PÁGINA DE PAGO  */
/* ================================================= */
document.addEventListener('DOMContentLoaded', () => {
    const formDetalle = document.querySelector('aside form');
    
    if (formDetalle) {
        formDetalle.addEventListener('submit', (e) => {
            e.preventDefault();
            const tour = window.dataTourGlobal;
            if (!tour) return alert("Por favor espera un segundo a que cargue el tour.");

            const selectTipo = document.getElementById('tipo-tour');
            const tipoElegido = selectTipo ? selectTipo.value : 'grupal';

            // Capturar la fecha elegida
            let fechaElegida = "";
            const cajaFijas = document.getElementById('contenedor-fechas-fijas');
            if (cajaFijas && getComputedStyle(cajaFijas).display !== 'none') {
                fechaElegida = document.getElementById('selector-fechas-fijas').value;
            } else {
                const inputLibre = document.querySelector('#contenedor-fecha-libre input');
                fechaElegida = inputLibre ? inputLibre.value : "Por coordinar";
            }

            const inputPasajeros = formDetalle.querySelector('input[type="number"]');
            const numPasajeros = parseInt(inputPasajeros ? inputPasajeros.value : 1) || 1;

            // Matemática del precio final por persona
            let precioUnitario = (tipoElegido === 'privado') ? Number(tour.precio_privado) : Number(tour.precio_grupal);
            if (tour.con_descuento && tour.porcentaje_descuento > 0) {
                precioUnitario = precioUnitario - (precioUnitario * (tour.porcentaje_descuento / 100));
            }

            const orden = {
                id: tour.id,
                titulo: tour.titulo,
                imagen: tour.imagen_url,
                modalidad: (tipoElegido === 'privado') ? 'Tour Privado' : 'Tour Grupal Compartido',
                fecha: fechaElegida,
                pasajeros: numPasajeros,
                precio_persona: precioUnitario.toFixed(2),
                total: (precioUnitario * numPasajeros).toFixed(2)
            };

            sessionStorage.setItem('ordenTurismoIca', JSON.stringify(orden));

            // ¡OJO AQUÍ! Pon el nombre exacto de tu archivo HTML de pago:
            window.location.href = "../Boleta/Pago.html";
        });
    }
});

/* ================================================= */
/* PASO 2: DIBUJAR EL RESUMEN EN LA VISTA DE PAGO    */
/* ================================================= */
document.addEventListener('DOMContentLoaded', () => {
    const contenedorResumen = document.getElementById('cuadro-resumen-dinamico');
    
    if (contenedorResumen) {
        const memoria = sessionStorage.getItem('ordenTurismoIca');
        if (!memoria) {
            contenedorResumen.innerHTML = `<p style="color:red; text-align:center;">No hay orden activa.<br><a href="Destino.html">Volver a destinos</a></p>`;
            return;
        }

        const o = JSON.parse(memoria);

        contenedorResumen.innerHTML = `
            <h3 style="border-bottom: 2px solid var(--color-boton); padding-bottom:10px;">Tu Orden</h3>
            
            <img src="${o.imagen}" class="foto-resumen" alt="${o.titulo}">
            
            <div class="lista-datos-resumen">
                <h4 style="margin-bottom:15px; font-size:1.2rem; color: var(--color-oscuro);">${o.titulo}</h4>
                <p><i class="fa-solid fa-tag"></i> <span><strong>Servicio:</strong> <br>${o.modalidad}</span></p>
                <p><i class="fa-solid fa-calendar-check"></i> <span><strong>Fecha:</strong> <br>${o.fecha}</span></p>
                <p><i class="fa-solid fa-users"></i> <span><strong>Pasajeros:</strong> <br>${o.pasajeros} persona(s)</span></p>
                <p><i class="fa-solid fa-coins"></i> <span><strong>Tarifa base:</strong> <br>S/ ${o.precio_persona} c/u</span></p>
                
                <div class="caja-total-pagar">
                   <span>Total:</span>
                   <span style="color: var(--color-boton); font-size: 1.4rem;">S/ ${o.total}</span>
                </div>
            </div>
        `;
    }
});

function alternarMetodoPago(metodo) {
    const vTarjeta = document.getElementById('vista-tarjeta');
    const vEfectivo = document.getElementById('vista-efectivo');
    const tabs = document.querySelectorAll('.pestanas-metodo .tab-pago');

    tabs.forEach(t => t.classList.remove('activo'));

    if (metodo === 'tarjeta') {
        vTarjeta.classList.remove('oculto');
        vEfectivo.classList.add('oculto');
        tabs[0].classList.add('activo');
    } else {
        vTarjeta.classList.add('oculto');
        vEfectivo.classList.remove('oculto');
        tabs[1].classList.add('activo');
    }
}

// =========================================================
// FUNCIÓN PARA PINTAR MIS VIAJES EN LA PESTAÑA DEL PERFIL
// =========================================================
window.cargarViajesUsuario = async function(idUsuario) {
    const contenedor = document.querySelector('.lista-viajes-cards');
    if (!contenedor) return;

    contenedor.innerHTML = '<p style="color: #666; padding: 20px;">Buscando tus reservas...</p>';

    try {
        const res = await fetch(`http://localhost:3000/api/reservas/usuario/${idUsuario}`);
        const reservas = await res.json();

        // NUEVO SALVAVIDAS: Verifica si el servidor devolvió un error (ej. olvidaste prender node server.js)
        if (!res.ok || !Array.isArray(reservas)) {
            console.error("Error del servidor:", reservas);
            contenedor.innerHTML = '<p style="color: #e51d2a; padding: 20px;">Hubo un problema de conexión. Asegúrate de haber reiniciado tu servidor (node server.js).</p>';
            return;
        }

        if (reservas.length === 0) {
            contenedor.innerHTML = '<p style="color: #666; padding: 20px;">Aún no tienes viajes programados. ¡Anímate a reservar tu primera aventura en nuestro catálogo!</p>';
            return;
        }

        contenedor.innerHTML = ''; // Limpiamos el texto de carga
        
        reservas.forEach(reserva => {
            const destino = reserva.destinos;
            if(!destino) return; 

            const colorEstado = reserva.estado === 'confirmado' ? '#2e7d32' : '#e51d2a';
            const textoEstado = reserva.estado.toUpperCase();
            
            const card = document.createElement('div');
            card.className = 'card-viaje-horizontal';
            card.innerHTML = `
                <div class="imagen-card">
                    <img src="${destino.imagen_url}" alt="${destino.titulo}">
                </div>
                <div class="info-card">
                    <div class="estado-viaje" style="color: ${colorEstado};">${textoEstado}</div>
                    <h3 style="color: var(--color-oscuro); margin-bottom: 5px;">${destino.titulo}</h3>
                    <p class="fecha-viaje" style="margin-bottom: 5px;"><i class="fa-regular fa-calendar"></i> ${reserva.fecha_reserva}</p>
                    <p class="desc-breve" style="color: #555; margin-bottom: 15px;">${reserva.modalidad} | ${reserva.pasajeros} Pasajero(s)</p>
                    
                    <div class="pie-card">
                        <span class="precio-pagado">S/ ${reserva.total}</span>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <span style="color: #888; font-size: 0.8rem; font-weight: bold; background: #f0f0f0; padding: 4px 10px; border-radius: 10px;">
                                <i class="fa-solid ${reserva.metodo_pago === 'tarjeta' ? 'fa-credit-card' : 'fa-money-bill'}"></i> 
                                ${reserva.metodo_pago.toUpperCase()}
                            </span>
                            <a href="#" class="btn-detalles" onclick="alert('Módulo de boleta en desarrollo')">Ver detalles</a>
                        </div>
                    </div>
                </div>
            `;
            contenedor.appendChild(card);
        });
    } catch (error) {
        console.error("Error al cargar viajes en el perfil:", error);
        contenedor.innerHTML = '<p style="color: #e51d2a; padding: 20px;">Ocurrió un error de red. ¿Tu servidor backend está encendido?</p>';
    }
};