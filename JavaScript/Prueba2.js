//Sistema de pago y registro de reservas
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formularioPago');
    const btnPagar = document.getElementById('btnPagar');
    const textoBoton = document.getElementById('textoBoton');
    const spinner = document.getElementById('spinner');
    const btnEfectivo = document.getElementById('btnEfectivo');
    const textoBotonEfectivo = document.getElementById('textoBotonEfectivo');
    const spinnerEfectivo = document.getElementById('spinnerEfectivo');
    const modalExito = document.getElementById('modalExito');
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
            if (res.ok) {
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
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            btnPagar.disabled = true;
            textoBoton.textContent = 'Procesando Pago...';
            spinner.classList.remove('oculto');
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
    if (btnEfectivo) {
        btnEfectivo.addEventListener('click', async () => {
            btnEfectivo.disabled = true;
            textoBotonEfectivo.textContent = 'Generando código...';
            spinnerEfectivo.classList.remove('oculto');
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
//Filtros de catálogo de viajes
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

//Verificar si hay un usuario logueado y mostrar su nombre en el menú
document.addEventListener('DOMContentLoaded', () => {
    const usuarioActivo = sessionStorage.getItem('usuarioLogueado');
    const rolActivo = sessionStorage.getItem('rolUsuario');
    const iconoPerfil = document.querySelector('.enlace-perfil-usuario');
    const menuPrincipalUl = document.querySelector('#menuPrincipal ul');
    if (usuarioActivo && iconoPerfil) {
        let primerNombre = usuarioActivo.split(' ')[0];
        const esSubcarpeta = window.location.pathname.includes('/Detalles/');
        const rutaPerfil = esSubcarpeta ? '../Perfil.html' : 'Perfil.html';
        const rutaAdmin = esSubcarpeta ? '../Admin.html' : 'Admin.html';
        iconoPerfil.setAttribute('href', rutaPerfil);
        iconoPerfil.style.color = '#e63946';
        iconoPerfil.style.fontWeight = 'bold';
        iconoPerfil.innerHTML = `<i class="fa-solid fa-user"></i> ${primerNombre}`;
        if (rolActivo && rolActivo.trim().toLowerCase() === 'admin' && menuPrincipalUl) {
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

//Sistema de Login y Registro
document.addEventListener('submit', (e) => {
    const titulo = document.title;
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

//Cargar catálogo de destinos en la página principal
async function cargarCatalogoDestinos() {
    try {
        const respuesta = await fetch('http://localhost:3000/api/destinos');
        const destinos = await respuesta.json();
        const contenedor = document.getElementById('contenedor-destinos');
        if (!contenedor) return;
        const idUsuario = sessionStorage.getItem("idUsuario");
        let misFavoritos = [];
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
            let htmlEtiquetaDescuento = '';
            let htmlPreciosGrupal = `<strong>S/ ${destino.precio_grupal}</strong>`;
            let htmlPreciosPrivado = `<strong style="color: var(--color-boton);">S/ ${destino.precio_privado}</strong>`;
            if (destino.con_descuento && destino.porcentaje_descuento > 0) {
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
// Función para manejar el clic en el botón de favorito
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
        const res = await fetch('http://localhost:3000/api/favoritos/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: idUsuario, destino_id: destinoId })
        });
        const data = await res.json();
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

//Tours destacados en la página principal
async function cargarToursDestacados() {
    const contenedor = document.getElementById('contenedor-destacados');
    if (!contenedor) return;
    try {
        const respuesta = await fetch('http://localhost:3000/api/destinos/destacados');
        const destacados = await respuesta.json();
        const idUsuario = sessionStorage.getItem("idUsuario");
        let misFavoritos = [];
        if (idUsuario) {
            try {
                const resFavs = await fetch(`http://localhost:3000/api/favoritos/ids/${idUsuario}`);
                if (resFavs.ok) misFavoritos = await resFavs.json();
            } catch (e) { console.warn("Offline favoritos"); }
        }
        contenedor.innerHTML = '';
        destacados.forEach(destino => {
            const card = document.createElement('div');
            card.className = 'cuadrito-viaje'; 
            const esFav = misFavoritos.includes(destino.id);
            const claseActiva = esFav ? 'activo' : '';
            const iconoClase = esFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
            let htmlEtiquetaDescuento = '';
            let htmlPreciosGrupal = `<strong>S/ ${destino.precio_grupal}</strong>`;
            let htmlPreciosPrivado = `<strong style="color: var(--color-boton);">S/ ${destino.precio_privado}</strong>`;
            if (destino.con_descuento && destino.porcentaje_descuento > 0) {
                let precioGrupalDescuento = (destino.precio_grupal - (destino.precio_grupal * destino.porcentaje_descuento / 100)).toFixed(2);
                let precioPrivadoDescuento = (destino.precio_privado - (destino.precio_privado * destino.porcentaje_descuento / 100)).toFixed(2);
                htmlEtiquetaDescuento = `<span class="etiqueta-descuento">-${destino.porcentaje_descuento}% OFF</span>`;
                htmlPreciosGrupal = `<div class="contenedor-precio-descuento"><span class="precio-antiguo">S/ ${destino.precio_grupal}</span><strong>S/ ${precioGrupalDescuento}</strong></div>`;
                htmlPreciosPrivado = `<div class="contenedor-precio-descuento"><span class="precio-antiguo">S/ ${destino.precio_privado}</span><strong style="color: var(--color-boton);">S/ ${precioPrivadoDescuento}</strong></div>`;
            }
            const posicionIzquierda = htmlEtiquetaDescuento ? '115px' : '15px';
            const insigniaTop = `<span style="position: absolute; top: 15px; left: ${posicionIzquierda}; background: #ffc107; color: #000; padding: 6px 14px; border-radius: 20px; font-weight: 800; font-size: 0.8rem; z-index: 10; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"><i class="fa-solid fa-fire"></i> Top</span>`;
            card.innerHTML = `
                <div class="cuadrito-viaje-imagen-wrapper">
                    ${htmlEtiquetaDescuento}
                    ${insigniaTop}
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
                            <div class="opcion-de-precio"><span>Grupal</span>${htmlPreciosGrupal}</div>
                            <div class="linea-vertical-precios"></div>
                            <div class="opcion-de-precio privado"><span>Privado</span>${htmlPreciosPrivado}</div>
                        </div>
                    </div>
                </a>
            `;
            contenedor.appendChild(card);
        });
    } catch (error) { 
        console.error("Error al cargar destacados:", error); 
    }
}

// Activar la función si estamos en la página de inicio
if (document.getElementById('contenedor-destacados')) cargarToursDestacados();

//Menu hamburguesa y scroll
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

//Selector de Fechas y Actualización de Precios Dinámica
function cambiarSelectorFecha() {
    var tipoTour = document.getElementById("tipo-tour").value;
    var cajaFechasFijas = document.getElementById("contenedor-fechas-fijas");
    var cajaFechaLibre = document.getElementById("contenedor-fecha-libre");
    if (cajaFechasFijas && cajaFechaLibre) {
        cajaFechasFijas.style.display = (tipoTour === "grupal") ? "block" : "none";
        cajaFechaLibre.style.display = (tipoTour === "privado") ? "block" : "none";
    }
    const d = window.dataTourGlobal;
    if (!d) return;
    let precioBase = (tipoTour === "privado") ? d.precio_privado : d.precio_grupal;
    let htmlPrecio = `Desde <strong>S/ ${precioBase}</strong>`;
    if (d.con_descuento && d.porcentaje_descuento > 0) {
        let precioRebajado = (precioBase - (precioBase * d.porcentaje_descuento / 100)).toFixed(2);
        htmlPrecio = `
            Desde <span style="text-decoration: line-through; color: #999; font-size: 0.9em;">S/ ${precioBase}</span> 
            <strong style="color: var(--color-boton); font-size: 1.3em; margin-left: 5px;">S/ ${precioRebajado}</strong>
            <span style="background: var(--color-boton); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8em; margin-left: 8px; vertical-align: middle;">-${d.porcentaje_descuento}%</span>
        `;
    }
    const labelDesde = document.getElementById("label-desde");
    if (labelDesde) {
        labelDesde.innerHTML = htmlPrecio;
    }
}

// Función de Cerrar Sesión
function cerrarSesion() {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = 'index.html';
}

//Sistema de gestión de tours dinámicos y comentarios
document.addEventListener("DOMContentLoaded", async () => {
    const tituloDestinoEl = document.getElementById("titulo-destino");
    if (!tituloDestinoEl) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) {
        window.location.href = "../Destino.html";
        return;
    }
    try {
        const res = await fetch(`http://localhost:3000/api/destinos/${id}`);
        const d = await res.json();
        document.title = `${d.titulo} | Turismo Ica`;
        tituloDestinoEl.innerText = d.titulo;
        document.getElementById("descripcion-larga").innerText = d.descripcion_larga;
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
        document.getElementById("portada-fondo").style.backgroundImage =
            `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${d.imagen_url})`;
        document.getElementById("link-mas-info").href = `../Informacion/Informacion.html?id=${d.id}`;
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
        const galeria = document.getElementById("galeria-fotos");
        if (d.imagenes_destino) {
            d.imagenes_destino.forEach((img) => {
                const el = document.createElement("img");
                el.src = img.url;
                el.alt = d.titulo;
                galeria.appendChild(el);
            });
        }
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

//Admin
// Este bloque inicializa las funciones del panel solo si el contenedor del admin existe en pantalla
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("contenedor-principal")) {
        mostrarSeccion("usuarios");
    }
});

//Cambiar entre secciones del panel de administración
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
        cargarTodasLasReservas();
    }
}

// Función para cargar la lista de usuarios en el panel de administración
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

//Cargar todas las reservas en el panel de administración
async function cargarTodasLasReservas() {
    const contenedor = document.getElementById("contenedor-principal");
    if (!contenedor) return;
    contenedor.innerHTML = '<h2>Cargando reservas desde la base de datos...</h2>';
    try {
        const res = await fetch("http://localhost:3000/api/admin/reservas");
        const reservas = await res.json();
        if (!res.ok || !Array.isArray(reservas)) {
            contenedor.innerHTML = '<p style="color: #e51d2a; padding: 20px;">Error al cargar las reservas. Verifica el servidor.</p>';
            return;
        }
        let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0;">Gestión de Reservas Globales</h2>
        </div>
        <div class="tabla-contenedor-movil">
            <table class="cuadro-estilo-excel">
                <thead>
                    <tr>
                        <th>ID / Fecha Compra</th>
                        <th>Cliente</th>
                        <th>Destino y Viaje</th>
                        <th>Pasajeros</th>
                        <th>Pago y Total</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
        `;
        if (reservas.length === 0) {
            html += `<tr><td colspan="6" style="text-align: center; padding: 30px; color: #777;">No hay reservas registradas en el sistema aún.</td></tr>`;
        } else {
            reservas.forEach(r => {
                const clienteNombre = r.usuarios ? r.usuarios.nombre : 'Usuario Borrado';
                const clienteEmail = r.usuarios ? r.usuarios.email : '';
                const destinoTitulo = r.destinos ? r.destinos.titulo : 'Destino Borrado';
                const colorEstado = r.estado === 'confirmado' ? 'pastilla-verde-estado' : 'pastilla-roja-estado';
                const textoEstadoFormateado = r.estado.charAt(0).toUpperCase() + r.estado.slice(1).toLowerCase();
                let fechaCreacion = 'No registrada';
                if (r.creado_en) {
                    const fechaObj = new Date(r.creado_en);
                    fechaCreacion = fechaObj.toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                }
                html += `
                <tr>
                    <td>
                        <span style="color: var(--color-boton); font-weight: 800; font-size: 1.1rem;">#${r.id}</span><br>
                        <span style="font-size: 0.8rem; color: #888;"><i class="fa-regular fa-clock"></i> ${fechaCreacion}</span>
                    </td>
                    <td>
                        <strong style="color: var(--color-oscuro);">${clienteNombre}</strong><br>
                        <span style="font-size: 0.85rem; color: #666;">${clienteEmail}</span>
                    </td>
                    <td>
                        <strong>${destinoTitulo}</strong><br>
                        <span style="font-size: 0.85rem; color: #555;">Reserva: ${r.fecha_reserva} | ${r.modalidad}</span>
                    </td>
                    <td style="text-align: center;"><strong>${r.pasajeros}</strong></td>
                    <td>
                        <strong style="color: var(--color-boton); font-size: 1.1rem;">S/ ${r.total}</strong><br>
                        <span style="font-size: 0.75rem; background: #f0f0f0; padding: 3px 8px; border-radius: 10px; font-weight: bold; color: #555;">
                            ${r.metodo_pago.toUpperCase()}
                        </span>
                    </td>
                    <td><span class="${colorEstado}" style="margin-top: 0;">${textoEstadoFormateado}</span></td>
                </tr>
                `;
            });
        }
        html += `</tbody></table></div>`;
        contenedor.innerHTML = html;
    } catch (error) {
        console.error("Error al cargar reservas en admin:", error);
        contenedor.innerHTML = '<p style="color: #e51d2a; padding: 20px;">Ocurrió un error de conexión con el backend.</p>';
    }
}
//Cargar destinos en el panel de administración
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
    document.getElementById("edit-id").value = "";
    document.getElementById("tituloEditor").innerText = "Añadir Nueva Ruta de Destino";
    document.getElementById("formEditor").reset();
    for (let i = 1; i <= 4; i++) {
        const input = document.getElementById(`img-galeria-${i}`);
        if (input) input.value = "";
    }
    document.getElementById('contenedor-itinerario-admin').innerHTML = '';
    agregarFilaItinerario();
    const modal = document.getElementById("modalEditor");
    if (modal) {
        modal.classList.remove("oculto");
        modal.style.display = "flex";
    }
}

// Función para abrir el editor de destino con los datos cargados
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
        const contenedorItinerario = document.getElementById('contenedor-itinerario-admin');
        contenedorItinerario.innerHTML = '';
        if (d.itinerarios && d.itinerarios.length > 0) {
            d.itinerarios.forEach(paso => agregarFilaItinerario(paso.hora, paso.titulo, paso.descripcion));
        } else {
            agregarFilaItinerario();
        }
    } catch (e) {
        alert("Error al cargar los detalles del destino.");
    }
}
// Función para cerrar el editor de destino
function cerrarEditor() {
    const modal = document.getElementById("modalEditor");
    if (modal) {
        modal.classList.add("oculto");
        modal.style.display = "none";
    }
}
// Función para agregar una fila de itinerario en el editor
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
        const tituloTexto = document.getElementById("edit-titulo").value.toLowerCase();
        let catAsignada = 'cultura';
        if (tituloTexto.includes('oasis') || tituloTexto.includes('duna') || tituloTexto.includes('sandboard') || tituloTexto.includes('tubular')) {
            catAsignada = 'aventura';
        } else if (tituloTexto.includes('reserva') || tituloTexto.includes('laguna') || tituloTexto.includes('cañón') || tituloTexto.includes('oasis')) {
            catAsignada = 'naturaleza';
        }
        const filasItinerario = document.querySelectorAll('.fila-itinerario-admin');
        const itinerarioData = [];
        filasItinerario.forEach(fila => {
            itinerarioData.push({
                hora: fila.querySelector('.it-hora').value,
                titulo: fila.querySelector('.it-titulo').value,
                descripcion: fila.querySelector('.it-desc').value
            });
        });
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
            categoria: catAsignada,
            itinerario: itinerarioData
        };
        try {
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
                cargarDestinos();
            } else {
                alert("Ocurrió un inconveniente al procesar la solicitud.");
            }
        } catch (err) {
            console.error("Error en la petición de administración:", err);
        }
    }
});
// Función para cambiar el estado activo de un destino turístico
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
            cargarDestinos();
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

//Función para cargar los destinos favoritos de un usuario en su perfil
window.cargarFavoritosUsuario = async function (idUsuario) {
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
        contenedor.innerHTML = '';
        favoritos.forEach(fav => {
            const destino = fav.destinos;
            if (!destino) return;
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

//Mandar a la página de pago con los datos de la orden
document.addEventListener('DOMContentLoaded', () => {
    const formDetalle = document.querySelector('aside form');
    if (formDetalle) {
        formDetalle.addEventListener('submit', (e) => {
            e.preventDefault();
            const tour = window.dataTourGlobal;
            if (!tour) return alert("Por favor espera un segundo a que cargue el tour.");
            const selectTipo = document.getElementById('tipo-tour');
            const tipoElegido = selectTipo ? selectTipo.value : 'grupal';
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
            window.location.href = "../Boleta/Pago.html";
        });
    }
});
//Resumen de la orden en la página de pago
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

//Función para cargar los viajes de un usuario en su perfil
window.cargarViajesUsuario = async function (idUsuario) {
    const contenedor = document.querySelector('.lista-viajes-cards');
    if (!contenedor) return;
    contenedor.innerHTML = '<p style="color: #666; padding: 20px;">Buscando tus reservas...</p>';
    try {
        const res = await fetch(`http://localhost:3000/api/reservas/usuario/${idUsuario}`);
        const reservas = await res.json();
        window.misReservasGlobales = reservas;
        if (!res.ok || !Array.isArray(reservas)) {
            contenedor.innerHTML = '<p style="color: #e51d2a; padding: 20px;">Hubo un problema de conexión. Asegúrate de haber reiniciado tu servidor.</p>';
            return;
        }
        const btnProximos = document.querySelector('.filtros-viajes .tab-filtro:first-child');
        window.filtrarViajes('proximos', btnProximos);
    } catch (error) {
        console.error("Error al cargar viajes en el perfil:", error);
        contenedor.innerHTML = '<p style="color: #e51d2a; padding: 20px;">Ocurrió un error de red. ¿Tu servidor backend está encendido?</p>';
    }
};
//Función para poder comparar fechas de reserva y filtrar viajes según el botón presionado
function parsearFechaReserva(fechaStr) {
    if (!fechaStr) return new Date(); 
    let fecha = new Date(fechaStr + 'T12:00:00'); 
    if (!isNaN(fecha.getTime())) return fecha;
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    const strLower = fechaStr.toLowerCase();
    let mesEncontrado = -1;
    for (let i = 0; i < meses.length; i++) {
        if (strLower.includes(meses[i])) {
            mesEncontrado = i;
            break;
        }
    }
    const numeros = fechaStr.match(/\d+/);
    const dia = numeros ? parseInt(numeros[0]) : null;
    if (mesEncontrado !== -1 && dia) {
        return new Date(2026, mesEncontrado, dia);
    }
    const fechaFutura = new Date();
    fechaFutura.setFullYear(fechaFutura.getFullYear() + 1);
    return fechaFutura;
}

//Función para filtrar los viajes según el botón presionado (próximos o pasados)
window.filtrarViajes = function(tipoFiltro, botonActivo = null) {
    if (botonActivo) {
        const botones = document.querySelectorAll('.filtros-viajes .tab-filtro');
        botones.forEach(btn => btn.classList.remove('activo'));
        botonActivo.classList.add('activo');
    }
    const contenedor = document.querySelector('.lista-viajes-cards');
    if (!contenedor) return;
    const reservas = window.misReservasGlobales || [];
    if (reservas.length === 0) {
        contenedor.innerHTML = '<p style="color: #666; padding: 20px;">Aún no tienes viajes programados. ¡Anímate a reservar tu primera aventura!</p>';
        return;
    }
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const reservasFiltradas = reservas.filter(reserva => {
        const fechaReserva = parsearFechaReserva(reserva.fecha_reserva);
        fechaReserva.setHours(0, 0, 0, 0);
        if (tipoFiltro === 'proximos') {
            return fechaReserva >= hoy;
        } else {
            return fechaReserva < hoy;
        }
    });
    contenedor.innerHTML = '';
    if (reservasFiltradas.length === 0) {
        contenedor.innerHTML = `<p style="color: #666; padding: 20px;">No tienes viajes ${tipoFiltro === 'proximos' ? 'próximos' : 'pasados'} en tu historial.</p>`;
        return;
    }
    reservasFiltradas.forEach(reserva => {
        const destino = reserva.destinos;
        if (!destino) return;
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
                        <a href="#" class="btn-detalles" onclick="event.preventDefault(); verDetallesBoleta(${reserva.id})">Ver detalles</a>
                    </div>
                </div>
            </div>
        `;
        contenedor.appendChild(card);
    });
};

//Función para ver los detalles de una boleta específica y redirigir a la página Boleta.html
window.verDetallesBoleta = function(idReserva) {
    const reservas = window.misReservasGlobales || [];
    const reserva = reservas.find(r => r.id === idReserva);
    if (reserva) {
        sessionStorage.setItem('boletaVisualizar', JSON.stringify(reserva));
        window.location.href = 'Boleta/Boleta.html';
    } else {
        alert("Error: No se encontraron los datos de esta reserva.");
    }
}

//Función para cargar los detalles de la boleta en la página Boleta.html
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('boleta-dinamica-pagina')) {
        const memoriaBoleta = sessionStorage.getItem('boletaVisualizar');
        const nombreUsuario = sessionStorage.getItem('usuarioLogueado') || 'Viajero';
        if (!memoriaBoleta) {
            alert('No hay datos para mostrar. Regresando al perfil...');
            window.location.href = '../Perfil.html';
            return;
        }
        const reserva = JSON.parse(memoriaBoleta);
        document.getElementById('boleta-id').innerText = `Orden #${reserva.id}`;
        document.getElementById('boleta-cliente').innerText = nombreUsuario;
        document.getElementById('boleta-destino').innerText = reserva.destinos.titulo;
        document.getElementById('boleta-fecha').innerText = reserva.fecha_reserva;
        document.getElementById('boleta-modalidad').innerText = reserva.modalidad;
        document.getElementById('boleta-pasajeros').innerText = `${reserva.pasajeros} Persona(s)`;
        document.getElementById('boleta-metodo').innerText = reserva.metodo_pago.toUpperCase();
        document.getElementById('boleta-total').innerText = `S/ ${reserva.total}`;
    }
});
//Función para cargar los datos del perfil del usuario en la página de configuración
window.cargarDatosPerfil = async function() {
    const idUsuario = sessionStorage.getItem("idUsuario");
    if (!idUsuario) return;
    try {
        const res = await fetch(`http://localhost:3000/api/usuarios/${idUsuario}`);
        if (res.ok) {
            const data = await res.json();
            document.getElementById('conf-nombre').value = data.nombre || '';
            document.getElementById('conf-tel').value = data.telefono || '';
        }
    } catch (error) {
        console.error("Error al cargar datos del perfil:", error);
    }
};

//Envía los cambios y actualiza la página sin recargar
window.guardarCambiosPerfil = async function() {
    const idUsuario = sessionStorage.getItem("idUsuario");
    if (!idUsuario) return;
    const boton = document.getElementById('btn-guardar-perfil');
    boton.innerText = 'Guardando...';
    boton.disabled = true;
    const nuevoNombre = document.getElementById('conf-nombre').value.trim();
    const nuevoTel = document.getElementById('conf-tel').value.trim();
    if (!nuevoNombre) {
        alert("El nombre no puede estar vacío.");
        boton.innerText = 'Guardar Cambios';
        boton.disabled = false;
        return;
    }
    try {
        const res = await fetch(`http://localhost:3000/api/usuarios/${idUsuario}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: nuevoNombre, telefono: nuevoTel })
        });
        if (res.ok) {
            alert("¡Tus datos han sido actualizados con éxito!");
            sessionStorage.setItem("usuarioLogueado", nuevoNombre);
            const primerNombre = nuevoNombre.split(' ')[0];
            const segundoNombre = nuevoNombre.split(' ')[1] || "";
            document.getElementById("nombreSidebar").textContent = `${primerNombre} ${segundoNombre}`;
            const iconoPerfil = document.querySelector('.enlace-perfil-usuario');
            if(iconoPerfil) {
                iconoPerfil.innerHTML = `<i class="fa-solid fa-user"></i> ${primerNombre}`;
            }
        } else {
            alert("Ocurrió un error al guardar los cambios.");
        }
    } catch (error) {
        console.error("Error al actualizar perfil:", error);
        alert("Error de conexión al servidor.");
    } finally {
        boton.innerText = 'Guardar Cambios';
        boton.disabled = false;
    }
};
//Función para agregar una fila de itinerario en el editor de destinos
window.agregarFilaItinerario = function(hora = '', titulo = '', descripcion = '') {
    const contenedor = document.getElementById('contenedor-itinerario-admin');
    if(!contenedor) return;
    const div = document.createElement('div');
    div.className = 'fila-itinerario-admin';
    div.style.cssText = 'display: flex; gap: 10px; align-items: flex-start; background: white; padding: 10px; border-radius: 6px; border: 1px solid #ccc;';
    div.innerHTML = `
        <div style="width: 100px;">
            <input type="text" class="it-hora" placeholder="Ej: 08:00 AM" value="${hora}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;" required>
        </div>
        <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 5px;">
            <input type="text" class="it-titulo" placeholder="Título de la actividad" value="${titulo}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;" required>
            <textarea class="it-desc" placeholder="Descripción..." rows="2" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; resize: none;" required>${descripcion}</textarea>
        </div>
        <button type="button" onclick="this.parentElement.remove()" style="background: #e51d2a; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;" title="Eliminar paso">
            <i class="fa-solid fa-trash"></i>
        </button>
    `;
    contenedor.appendChild(div);
}

//Función para cargar la información de un destino turístico en la página de información dinámica
document.addEventListener('DOMContentLoaded', async () => {
    if (document.getElementById('boleta-dinamica-pagina')) {
        const memoriaBoleta = sessionStorage.getItem('boletaVisualizar');
        const nombreUsuario = sessionStorage.getItem('usuarioLogueado') || 'Viajero';
        if (!memoriaBoleta) {
            alert('No hay datos para mostrar. Regresando al perfil...');
            window.location.href = '../Perfil.html';
            return;
        }
        const reserva = JSON.parse(memoriaBoleta);
        document.getElementById('boleta-id').innerText = `Orden #${reserva.id}`;
        document.getElementById('boleta-cliente').innerText = nombreUsuario;
        document.getElementById('boleta-fecha').innerText = reserva.fecha_reserva;
        document.getElementById('boleta-modalidad').innerText = reserva.modalidad;
        document.getElementById('boleta-pasajeros').innerText = `${reserva.pasajeros} Persona(s)`;
        document.getElementById('boleta-metodo').innerText = reserva.metodo_pago.toUpperCase();
        document.getElementById('boleta-total').innerText = `S/ ${reserva.total}`;
        try {
            const resDestino = await fetch(`http://localhost:3000/api/destinos/${reserva.destino_id}`);
            const d = await resDestino.json();
            document.getElementById('boleta-destino').innerText = d.titulo;
            document.getElementById('boleta-titulo-foto').innerText = d.titulo;
            document.getElementById('boleta-desc-foto').innerText = d.descripcion_corta || '';
            document.getElementById('fondo-hoja-1').style.backgroundImage = `url(${d.imagen_url})`;
            const listaItinerario = document.getElementById('boleta-lista-itinerario');
            listaItinerario.innerHTML = '';
            if (d.itinerarios && d.itinerarios.length > 0) {
                d.itinerarios.forEach(paso => {
                    listaItinerario.innerHTML += `
                        <li style="margin-bottom: 12px; font-size: 0.95rem; line-height: 1.4;">
                            <strong style="color: #e51d2a;">${paso.hora}</strong> - <strong>${paso.titulo}</strong><br>
                            <span style="color: #444;">${paso.descripcion}</span>
                        </li>
                    `;
                });
            } else {
                listaItinerario.innerHTML = '<p style="color:#666;">El itinerario de este tour se está actualizando.</p>';
            }
            const mapasGuia = {
                'huacachina': 'https://res.cloudinary.com/dsk6vsr0c/image/upload/q_auto/f_auto/v1777565909/Ruta_Huaca_eu2m6n.png',
                'pisco': 'https://res.cloudinary.com/dsk6vsr0c/image/upload/q_auto/f_auto/v1777565909/Ruta_Pisco_rikobu.png',
                'cañón': 'https://res.cloudinary.com/dsk6vsr0c/image/upload/q_auto/f_auto/v1777565903/Ruta_Ca%C3%B1on_wha7ty.png',
                'paracas': 'https://res.cloudinary.com/dsk6vsr0c/image/upload/q_auto/f_auto/v1777602138/Ruta_Paracas_b6zl3i.png',
                'nazca': 'https://res.cloudinary.com/dsk6vsr0c/image/upload/q_auto/f_auto/v1777565908/Ruta_Nazca_vlhgtn.png',
                'cachiche': 'https://res.cloudinary.com/dsk6vsr0c/image/upload/q_auto/f_auto/v1777565913/Ruta_Cachiche_dakdx2.png',
                'cahuachi': 'https://res.cloudinary.com/dsk6vsr0c/image/upload/q_auto/f_auto/v1777606679/Ruta_Cahuachi.png',
                'cantalloc': 'https://res.cloudinary.com/dsk6vsr0c/image/upload/q_auto/f_auto/v1777608629/Ruta_Cantalloc.png',
                'morón': 'https://res.cloudinary.com/dsk6vsr0c/image/upload/q_auto/f_auto/v1777664959/Ruta_Moron.png',
                'museo': 'https://res.cloudinary.com/dsk6vsr0c/image/upload/q_auto/f_auto/v1777664669/Ruta_Museo.png',
                'ocucaje': 'https://res.cloudinary.com/dsk6vsr0c/image/upload/q_auto/f_auto/v1777665063/Ruta_Ocucaje.png'
            };
            let urlMapaFinal = d.imagen_url;
            const tituloLower = d.titulo.toLowerCase();
            for (const [clave, url] of Object.entries(mapasGuia)) {
                if (tituloLower.includes(clave)) {
                    urlMapaFinal = url;
                    break;
                }
            }
            document.getElementById('boleta-mapa-img').src = urlMapaFinal;
        } catch (error) {
            console.error("Error al cargar detalles para la boleta:", error);
        }
    }
});
