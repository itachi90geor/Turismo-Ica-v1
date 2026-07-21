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

//Verificar si hay un usuario logueado y mostrar su nombre y foto en el menú
document.addEventListener('DOMContentLoaded', async () => {
    const usuarioActivo = sessionStorage.getItem('usuarioLogueado');
    let rolActivo = sessionStorage.getItem('rolUsuario'); 
    const idActivo = sessionStorage.getItem("idUsuario");
    let avatarActivo = sessionStorage.getItem('avatarUsuario'); 
    
    const iconoPerfil = document.querySelector('.enlace-perfil-usuario');
    const menuPrincipalUl = document.querySelector('#menuPrincipal ul');
    const avatarSidebar = document.getElementById("sidebar-avatar-container");
    
    // 1. Sincronización estricta con el servidor
    if (idActivo) {
        try {
            // Se añade { cache: 'no-store' } para obligar al navegador a pedir los datos frescos, ignorando su historial
            const res = await fetch(`http://localhost:3000/api/usuarios/${idActivo}`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                
                if (data.avatar_url && data.avatar_url !== "") {
                    avatarActivo = data.avatar_url;
                    sessionStorage.setItem('avatarUsuario', avatarActivo);
                }
                
                // Si el backend envía el rol, lo actualizamos al instante en la memoria
                if (data.rol !== undefined || data.role !== undefined) {
                    rolActivo = data.rol || data.role;
                    sessionStorage.setItem('rolUsuario', rolActivo);
                } else {
                    console.warn("⚠️ Atención Backend: La ruta /api/usuarios/:id no está devolviendo la columna 'rol'.");
                }
            }
        } catch (e) {
            console.error("No se pudo sincronizar el usuario con el servidor.");
        }
    }

    if (iconoPerfil) {
        const rutaOriginal = iconoPerfil.getAttribute('href') || '';
        const esSubcarpeta = rutaOriginal.includes('../');
        const rutaPerfil = esSubcarpeta ? '../Perfil.html' : 'Perfil.html';
        const rutaAdmin = esSubcarpeta ? '../Admin.html' : 'Admin.html';
        const rutaLogin = esSubcarpeta ? '../Login.html' : 'Login.html';
        
        if (usuarioActivo) {
            let primerNombre = usuarioActivo.split(' ')[0];
            iconoPerfil.setAttribute('href', rutaPerfil);
            iconoPerfil.style.color = '#e63946';
            iconoPerfil.style.fontWeight = 'bold';
            
            if (avatarActivo && avatarActivo !== "") {
                iconoPerfil.innerHTML = `<img src="${avatarActivo}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:2px solid var(--color-boton);"> ${primerNombre}`;
            } else {
                iconoPerfil.innerHTML = `<i class="fa-solid fa-user"></i> ${primerNombre}`;
            }
            
            // 2. Lógica estricta de aparición y eliminación del botón Admin
            const linkAdminExistente = document.getElementById('link-panel-admin');
            
            if (rolActivo && rolActivo.trim().toLowerCase() === 'admin' && menuPrincipalUl) {
                if (!linkAdminExistente) {
                    const liAdmin = document.createElement('li');
                    liAdmin.id = 'link-panel-admin';
                    liAdmin.innerHTML = `<a href="${rutaAdmin}" style="color: #e63946; font-weight: 800;"><i class="fa-solid fa-shield-halved"></i> PANEL ADMIN</a>`;
                    menuPrincipalUl.appendChild(liAdmin);
                }
            } else {
                // Si el usuario fue degradado a "usuario" normal, eliminamos el botón inmediatamente
                if (linkAdminExistente) {
                    linkAdminExistente.remove();
                }
            }
        } else {
            iconoPerfil.setAttribute('href', rutaLogin);
        }
    }

    if (avatarSidebar && avatarActivo && avatarActivo !== "") {
        avatarSidebar.innerHTML = `<img src="${avatarActivo}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
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
                    sessionStorage.setItem('avatarUsuario', data.avatar_url || '');
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
        const idActivo = sessionStorage.getItem("idUsuario"); // Obtenemos el ID del usuario logueado

        if (d.comentarios && d.comentarios.length > 0) {
            contenedorComentarios.innerHTML = "";
            d.comentarios.forEach((c) => {
                // Dibujamos las estrellas rojas
                let htmlStars = '';
                for(let i=0; i < (c.estrellas || 5); i++) {
                    htmlStars += '<i class="fa-solid fa-star" style="color: var(--color-boton); font-size: 0.8rem;"></i>';
                }

                // Validación estricta: Convertimos a Texto (String) para asegurar que coincidan perfectamente
                let btnEditar = "";
                if (idActivo && c.usuario_id && String(idActivo) === String(c.usuario_id)) {
                    const textoLimpio = c.texto.replace(/(\r\n|\n|\r)/gm, " "); 
                    btnEditar = `<button onclick="habilitarEdicionComentario(${c.id}, '${textoLimpio}', ${c.estrellas})" style="background:none; border:none; color:#1976d2; cursor:pointer; font-size:0.85rem; margin-top:10px; font-weight: bold;"><i class="fa-solid fa-pen"></i> Editar mi opinión</button>`;
                }

                contenedorComentarios.innerHTML += `
                    <div class="cuadro-opinion-cliente" id="comentario-box-${c.id}">
                        <div style="display:flex; justify-content:space-between; align-items:start;">
                            <h4 style="margin:0;">${c.usuarios.nombre}</h4>
                            <div>${htmlStars}</div>
                        </div>
                        <p style="margin-top: 8px;">${c.texto}</p>
                        ${btnEditar}
                    </div>`;
            });
        } else {
            contenedorComentarios.innerHTML = '<p class="cuadro-opinion-cliente">No hay comentarios aún. ¡Sé el primero!</p>';
        }

        const cajaComentario = document.getElementById("seccion-postear-comentario");
        if (idActivo) {
            cajaComentario.innerHTML = `
                <h3 style="margin-bottom: 15px;">Deja tu opinión</h3>
                <select id="estrellas-nuevo-comentario" class="input-moderno" style="width: 100%; margin-bottom: 15px; font-weight: bold;">
                    <option value="5">5 Estrellas (Excelente)</option>
                    <option value="4">4 Estrellas (Muy bueno)</option>
                    <option value="3">3 Estrellas (Bueno)</option>
                    <option value="2">2 Estrellas (Regular)</option>
                    <option value="1">1 Estrella (Malo)</option>
                </select>
                <textarea id="texto-nuevo-comentario" class="textarea-comentario input-moderno" placeholder="¿Qué te pareció este tour?" rows="3" style="width: 100%; margin-bottom: 15px;"></textarea>
                <button onclick="enviarComentario(${id})" class="boton-rojo-ingresar boton-comentario-publicar">
                    Publicar Comentario
                </button>
            `;
        } else {
            cajaComentario.innerHTML = `
                <p class="caja-comentario-visitante" style="margin:0;"><strong>¿Quieres comentar?</strong> <a href="../Login.html" class="enlace-login-comentario">Inicia sesión aquí</a> para compartir tu experiencia.</p>
            `;
        }
    } catch (error) {
        console.error("Error al cargar el tour dinámico:", error);
    }
});

// Función global expuesta para procesar el envío de comentarios
window.enviarComentario = async (destinoId) => {
    const texto = document.getElementById("texto-nuevo-comentario").value;
    const estrellas = document.getElementById("estrellas-nuevo-comentario").value;
    
    if (!texto.trim()) return alert("Escribe un comentario primero.");
    try {
        const res = await fetch("http://localhost:3000/api/comentarios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                destino_id: destinoId,
                usuario_id: sessionStorage.getItem("idUsuario"),
                texto: texto,
                estrellas: parseInt(estrellas),
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

// Convierte la tarjeta de texto estático en un formulario editable
window.habilitarEdicionComentario = function(idComentario, textoActual, estrellasActuales) {
    const box = document.getElementById(`comentario-box-${idComentario}`);
    box.innerHTML = `
        <h4 style="margin-bottom: 10px; color: var(--color-boton);">Editando tu opinión...</h4>
        <select id="edit-star-${idComentario}" class="input-moderno" style="margin-bottom:10px; width: 100%; font-weight: bold;">
            <option value="5" ${estrellasActuales == 5 ? 'selected' : ''}>5 Estrellas (Excelente)</option>
            <option value="4" ${estrellasActuales == 4 ? 'selected' : ''}>4 Estrellas (Muy bueno)</option>
            <option value="3" ${estrellasActuales == 3 ? 'selected' : ''}>3 Estrellas (Bueno)</option>
            <option value="2" ${estrellasActuales == 2 ? 'selected' : ''}>2 Estrellas (Regular)</option>
            <option value="1" ${estrellasActuales == 1 ? 'selected' : ''}>1 Estrella (Malo)</option>
        </select>
        <textarea id="edit-texto-${idComentario}" class="input-moderno" rows="3" style="width:100%; margin-bottom:10px;">${textoActual}</textarea>
        <div style="display:flex; gap:10px;">
            <button onclick="guardarEdicionComentario(${idComentario})" class="btn-detalles" style="background: var(--color-boton); color: white;">Guardar Cambios</button>
            <button onclick="location.reload()" class="btn-detalles" style="color: #555; border-color: #ccc;">Cancelar</button>
        </div>
    `;
};

// Envía la actualización a la base de datos
window.guardarEdicionComentario = async function(idComentario) {
    const nuevoTexto = document.getElementById(`edit-texto-${idComentario}`).value;
    const nuevasEstrellas = document.getElementById(`edit-star-${idComentario}`).value;

    if (!nuevoTexto.trim()) return alert("El comentario no puede estar vacío.");

    try {
        const res = await fetch(`http://localhost:3000/api/comentarios/${idComentario}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texto: nuevoTexto, estrellas: nuevasEstrellas })
        });
        if (res.ok) {
            alert("¡Tu comentario ha sido actualizado!");
            location.reload();
        } else {
            alert("Ocurrió un error al actualizar el comentario.");
        }
    } catch(e) {
        console.error(e);
        alert("Error de conexión con el servidor.");
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
    document.querySelectorAll(".nav-sidebar a").forEach((a) => a.classList.remove("activo"));
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
    } else if (seccion === "dashboard") {
        cargarDashboard(); // <-- Agregamos esta línea
    }else if (seccion === "consultas") { 
        cargarConsultasAdmin(); 
    }
}

// Función para cargar el dashboard con estadísticas

// Función para ENVIAR desde Nosotros.html
window.enviarConsultaNosotros = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.innerText = "Enviando...";
    btn.disabled = true;

    const nombre = document.getElementById("nombre").value;
    const email = document.getElementById("email").value;
    const mensaje = document.getElementById("mensaje").value;
    const usuario_id = sessionStorage.getItem("idUsuario") || null; // Saca el ID si está logueado

    try {
        const res = await fetch("http://localhost:3000/api/consultas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario_id, nombre, email, mensaje })
        });
        if (res.ok) {
            alert("¡Mensaje enviado con éxito! Te responderemos pronto.");
            e.target.reset();
        } else {
            alert("Error al enviar el mensaje.");
        }
    } catch(err) {
        console.error(err);
        alert("Error de conexión.");
    } finally {
        btn.innerText = "Enviar Mensaje";
        btn.disabled = false;
    }
};

// Función para LEER las consultas en Admin.html
window.cargarConsultasAdmin = async function() {
    const contenedor = document.getElementById("contenedor-principal");
    if (!contenedor) return;
    contenedor.innerHTML = '<h2>Cargando bandeja de entrada...</h2>';

    try {
        const res = await fetch("http://localhost:3000/api/admin/consultas");
        const consultas = await res.json();

        let html = `
            <div style="margin-bottom: 20px;">
                <h2 style="margin: 0;">Bandeja de Consultas</h2>
                <p style="color: #666;">Responde a los viajeros. Los mensajes rojos requieren tu atención urgente.</p>
            </div>
        `;

        if(consultas.length === 0) {
            html += `<p style="color: #666;">No hay mensajes nuevos.</p>`;
        } else {
            consultas.forEach(c => {
                const esRespondido = c.estado === 'respondido';
                const claseCard = esRespondido ? 'card-consulta respondido' : 'card-consulta';
                const etiquetaEstado = esRespondido 
                    ? `<span style="background:#2e7d32; color:white; padding:4px 10px; border-radius:12px; font-size:0.8rem; font-weight:bold;">RESPONDIDO</span>`
                    : `<span style="background:#e51d2a; color:white; padding:4px 10px; border-radius:12px; font-size:0.8rem; font-weight:bold;">PENDIENTE</span>`;

                let zonaRespuesta = "";
                
                // Lógica del Chat: Si falta responder, sale la caja de texto. Si ya se respondió, sale el texto verde.
                if (!esRespondido) {
                    zonaRespuesta = `
                        <div class="caja-responder">
                            <textarea id="reply-text-${c.id}" class="input-moderno" rows="3" style="width:100%; margin-bottom:10px;" placeholder="Escribe tu respuesta aquí..."></textarea>
                            <button onclick="responderConsultaAdmin(${c.id})" class="btn-detalles" style="background:var(--color-boton); color:white; border:none; padding:8px 15px;">Enviar Respuesta</button>
                        </div>
                    `;
                } else {
                    zonaRespuesta = `
                        <div class="respuesta-admin-caja">
                            <strong><i class="fa-solid fa-headset"></i> Tu Respuesta:</strong>
                            <p style="margin-top:5px; color:#1a1a1a;">${c.respuesta}</p>
                        </div>
                    `;
                }

                html += `
                    <div class="${claseCard}">
                        <div class="card-consulta-header">
                            <div>
                                <strong style="font-size:1.1rem;">${c.nombre}</strong> <span style="color:#888; font-size:0.9rem;">(${c.email})</span>
                            </div>
                            <div>${etiquetaEstado}</div>
                        </div>
                        <div class="mensaje-cliente-caja">
                            <i class="fa-solid fa-quote-left" style="color:#ccc; margin-right:5px;"></i> ${c.mensaje}
                        </div>
                        ${zonaRespuesta}
                    </div>
                `;
            });
        }
        contenedor.innerHTML = html;
    } catch(err) {
        contenedor.innerHTML = '<p style="color:red;">Error al cargar las consultas.</p>';
    }
};

// Función para RESPONDER desde el Admin
window.responderConsultaAdmin = async function(id) {
    const textoRespuesta = document.getElementById(`reply-text-${id}`).value;
    if(!textoRespuesta.trim()) return alert("Debes escribir una respuesta.");

    try {
        const res = await fetch(`http://localhost:3000/api/admin/consultas/${id}`, {
            method: 'PUT',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ respuesta: textoRespuesta })
        });
        if(res.ok) {
            alert("Respuesta enviada correctamente.");
            cargarConsultasAdmin(); // Recarga la pestaña para que se ponga verde
        }
    } catch(err) {
        alert("Error al enviar la respuesta.");
    }
};

// Variables globales para guardar los gráficos y poder destruirlos al filtrar
let graficoDestinosGlobal = null;
let graficoPagosGlobal = null;

// Función Principal: Carga los datos y dibuja la barra de filtros
async function cargarDashboard() {
    const contenedor = document.getElementById("contenedor-principal");
    if (!contenedor) return;

    contenedor.innerHTML = '<h2>Cargando métricas...</h2>';

    try {
        const res = await fetch("http://localhost:3000/api/admin/reservas");
        const reservas = await res.json();
        
        // Guardamos las reservas en la memoria global para poder filtrarlas luego sin volver a descargar
        window.reservasDashboardGlobal = reservas; 

        // Extraemos automáticamente los destinos que existen para llenar el "Select"
        const destinosUnicos = [...new Set(reservas.map(r => r.destinos ? r.destinos.titulo : 'Destino Borrado'))];
        let opcionesDestino = '<option value="">Todos los Destinos</option>';
        destinosUnicos.forEach(d => opcionesDestino += `<option value="${d}">${d}</option>`);

        // Dibujamos la estructura: Títulos + Barra de Filtros + Contenedor Vacío para las métricas
        contenedor.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h2 style="margin: 0;">Panel de Rendimiento (Dashboard)</h2>
                <p style="color: #666; margin-top: 5px;">Resumen global de la plataforma Turismo Ica.</p>
            </div>
            
            <!-- BARRA DE FILTROS -->
            <div class="filtros-dashboard">
                <select id="dash-filtro-destino">${opcionesDestino}</select>
                <select id="dash-filtro-estado">
                    <option value="">Todos los Estados</option>
                    <option value="confirmado">Solo Confirmados</option>
                    <option value="pendiente">Solo Pendientes</option>
                </select>
                <input type="date" id="dash-fecha-inicio" title="Fecha Desde">
                <input type="date" id="dash-fecha-fin" title="Fecha Hasta">
                
                <button onclick="aplicarFiltrosDashboard()" class="btn-filtrar">Aplicar Filtros</button>
                <button onclick="limpiarFiltrosDashboard()" class="btn-reset">Limpiar</button>
            </div>

            <!-- Aquí se inyectarán las tarjetas y gráficos matemáticos -->
            <div id="dashboard-contenido-dinamico"></div>
        `;

        // Arrancamos renderizando todo por primera vez (sin filtros)
        renderizarDatosDashboard(reservas);

    } catch (error) {
        console.error("Error al cargar dashboard:", error);
        contenedor.innerHTML = '<p style="color: #e51d2a; padding: 20px;">Ocurrió un error al cargar los datos.</p>';
    }
}

// Variables globales para destruir gráficos viejos al usar filtros
let chartVentasDiarias = null;
let chartTopDestinos = null;
let chartVentasMensuales = null;
let chartPasajeros = null;

// Función Secundaria: Recibe las reservas (filtradas o no) y hace la matemática
function renderizarDatosDashboard(reservasAProcesar) {
    const contenedorDinamico = document.getElementById("dashboard-contenido-dinamico");
    if (!contenedorDinamico) return;

    // --- 1. Variables para las 4 tarjetas (KPIs) superiores ---
    let ingresosConfirmados = 0; let ingresosPendientes = 0;
    let totalReservas = reservasAProcesar.length;
    let conteoPopulares = {};

    // --- 2. Variables para los 4 gráficos ---
    let ventasDiarias = {};
    let ventasDestinos = {};
    let ventasMensuales = {};
    let pasajerosDiarios = {};

    // Procesamos toda la data
    reservasAProcesar.forEach(r => {
        const monto = parseFloat(r.total) || 0;
        const pax = parseInt(r.pasajeros) || 1;
        const destinoNombre = r.destinos ? r.destinos.titulo : 'Borrado';

        // Acumular para KPIs
        if (r.estado === 'confirmado') ingresosConfirmados += monto;
        else ingresosPendientes += monto;
        conteoPopulares[destinoNombre] = (conteoPopulares[destinoNombre] || 0) + 1;

        // Estandarizar la fecha para agrupar (YYYY-MM-DD y YYYY-MM)
        const fechaObj = window.parsearFechaReserva(r.fecha_reserva);
        const dia = fechaObj.toISOString().split('T')[0]; 
        const mes = dia.substring(0, 7); 

        // Acumular para Gráficos
        ventasDiarias[dia] = (ventasDiarias[dia] || 0) + monto;
        ventasDestinos[destinoNombre] = (ventasDestinos[destinoNombre] || 0) + monto;
        ventasMensuales[mes] = (ventasMensuales[mes] || 0) + monto;
        pasajerosDiarios[dia] = (pasajerosDiarios[dia] || 0) + pax;
    });

    // Tour más popular (para la tarjeta superior)
    let topDestino = totalReservas > 0 ? "Ninguno" : "Sin Datos";
    let maxVentas = 0;
    for (const [destino, cantidad] of Object.entries(conteoPopulares)) {
        if (cantidad > maxVentas) { maxVentas = cantidad; topDestino = destino; }
    }

    // Dibujamos HTML de las Tarjetas y los 4 Contenedores de Gráficos
    contenedorDinamico.innerHTML = `
        <div class="kpi-grid">
            <div class="kpi-card" style="border-color: #2e7d32;">
                <i class="fa-solid fa-sack-dollar" style="color: #2e7d32;"></i>
                <div class="kpi-info"><p>Ingresos Confirmados</p><h3>S/ ${ingresosConfirmados.toFixed(2)}</h3></div>
            </div>
            <div class="kpi-card" style="border-color: #ff9800;">
                <i class="fa-solid fa-money-bill-transfer" style="color: #ff9800;"></i>
                <div class="kpi-info"><p>Pagos Pendientes</p><h3>S/ ${ingresosPendientes.toFixed(2)}</h3></div>
            </div>
            <div class="kpi-card" style="border-color: #1976d2;">
                <i class="fa-solid fa-ticket" style="color: #1976d2;"></i>
                <div class="kpi-info"><p>Total de Reservas</p><h3>${totalReservas}</h3></div>
            </div>
            <div class="kpi-card" style="border-color: var(--color-boton);">
                <i class="fa-solid fa-fire" style="color: var(--color-boton);"></i>
                <div class="kpi-info"><p>Tour más popular</p><h3 style="font-size: 1rem; margin-top: 5px;">${topDestino}</h3></div>
            </div>
        </div>

        <div class="charts-grid">
            <div class="chart-card">
                <h3>Tendencia de Ventas</h3>
                <div class="chart-wrapper"><canvas id="graficoVentasDiarias"></canvas></div>
            </div>
            <div class="chart-card">
                <h3>Top Productos (Soles)</h3>
                <div class="chart-wrapper"><canvas id="graficoTopDestinos"></canvas></div>
            </div>
            <div class="chart-card">
                <h3>Ventas por Mes</h3>
                <div class="chart-wrapper"><canvas id="graficoVentasMensuales"></canvas></div>
            </div>
            <div class="chart-card">
                <h3>Tendencia de Pasajeros</h3>
                <div class="chart-wrapper"><canvas id="graficoPasajeros"></canvas></div>
            </div>
        </div>
    `;

    // Limpiamos memoria si se están re-dibujando por un filtro
    if (chartVentasDiarias) chartVentasDiarias.destroy();
    if (chartTopDestinos) chartTopDestinos.destroy();
    if (chartVentasMensuales) chartVentasMensuales.destroy();
    if (chartPasajeros) chartPasajeros.destroy();

    if (totalReservas > 0) {
        // Ordenamos las fechas de menor a mayor
        const diasOrdenados = Object.keys(ventasDiarias).sort();
        const mesesOrdenados = Object.keys(ventasMensuales).sort();

        // 1. Gráfico de Líneas - Tendencia de Ventas (Azul)
        chartVentasDiarias = new Chart(document.getElementById('graficoVentasDiarias'), {
            type: 'line',
            data: {
                labels: diasOrdenados,
                datasets: [{
                    label: 'Ventas Diarias (S/)',
                    data: diasOrdenados.map(d => ventasDiarias[d]),
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }
        });

        // 2. Gráfico de Barras Horizontales - Top Destinos (Verde)
        const destinosTop = Object.entries(ventasDestinos).sort((a, b) => b[1] - a[1]).slice(0, 6);
        chartTopDestinos = new Chart(document.getElementById('graficoTopDestinos'), {
            type: 'bar',
            data: {
                labels: destinosTop.map(d => d[0]),
                datasets: [{
                    label: 'Monto Vendido (S/)',
                    data: destinosTop.map(d => d[1]),
                    backgroundColor: '#2ecc71',
                    borderRadius: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { position: 'top' } } }
        });

        // 3. Gráfico de Barras Verticales - Ventas por Mes (Naranja)
        chartVentasMensuales = new Chart(document.getElementById('graficoVentasMensuales'), {
            type: 'bar',
            data: {
                labels: mesesOrdenados,
                datasets: [{
                    label: 'Ventas Mensuales (S/)',
                    data: mesesOrdenados.map(m => ventasMensuales[m]),
                    backgroundColor: '#e67e22',
                    borderRadius: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }
        });

        // 4. Gráfico de Líneas - Tendencia de Pasajeros (Amarillo)
        chartPasajeros = new Chart(document.getElementById('graficoPasajeros'), {
            type: 'line',
            data: {
                labels: diasOrdenados,
                datasets: [{
                    label: 'Unidades / Pasajeros',
                    data: diasOrdenados.map(d => pasajerosDiarios[d]),
                    borderColor: '#f39c12',
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    borderWidth: 2,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#f39c12'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }
        });
    }
}

// Evento: Al hacer clic en "Aplicar Filtros"
window.aplicarFiltrosDashboard = function() {
    const reservas = window.reservasDashboardGlobal || [];
    const fDestino = document.getElementById("dash-filtro-destino").value;
    const fEstado = document.getElementById("dash-filtro-estado").value;
    const fInicio = document.getElementById("dash-fecha-inicio").value;
    const fFin = document.getElementById("dash-fecha-fin").value;

    const reservasFiltradas = reservas.filter(r => {
        const nombreD = r.destinos ? r.destinos.titulo : 'Destino Borrado';
        let cumpleDestino = (fDestino === "" || nombreD === fDestino);
        let cumpleEstado = (fEstado === "" || r.estado === fEstado);
        
        // Filtro inteligente de fechas usando tu función parsearFechaReserva
        let cumpleFecha = true;
        if (fInicio || fFin) {
            const fechaReserva = window.parsearFechaReserva(r.fecha_reserva);
            fechaReserva.setHours(0,0,0,0);
            
            if (fInicio) {
                const dIni = new Date(fInicio + 'T00:00:00');
                if (fechaReserva < dIni) cumpleFecha = false;
            }
            if (fFin) {
                const dFin = new Date(fFin + 'T00:00:00');
                if (fechaReserva > dFin) cumpleFecha = false;
            }
        }
        return cumpleDestino && cumpleEstado && cumpleFecha;
    });

    renderizarDatosDashboard(reservasFiltradas);
}

// Evento: Al hacer clic en "Limpiar"
window.limpiarFiltrosDashboard = function() {
    document.getElementById("dash-filtro-destino").value = "";
    document.getElementById("dash-filtro-estado").value = "";
    document.getElementById("dash-fecha-inicio").value = "";
    document.getElementById("dash-fecha-fin").value = "";
    renderizarDatosDashboard(window.reservasDashboardGlobal); // Volver al estado original
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
        <!-- AQUÍ AGREGAMOS EL ENVOLTORIO MÓVIL -->
        <div class="tabla-contenedor-movil">
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
            </table>
        </div>`;
      
        const tbody = document.getElementById("listaUsuarios");
        
        usuarios.forEach((u) => {
            const fila = document.createElement("tr");
            
            // Lógica inteligente para saber qué texto poner en los botones
            const textoBotonEstado = u.activo ? "Desactivar" : "Activar";
            const textoBotonRol = u.rol === 'admin' ? 'Quitar Admin' : 'Hacer Admin';
            const nuevoRol = u.rol === 'admin' ? 'usuario' : 'admin';
            
            fila.innerHTML = `
        <td>${u.nombre}</td>
        <td>${u.email}</td>
        <td><strong>${u.rol.toUpperCase()}</strong></td>
        <td><span class="${u.activo ? "texto-activo-bold" : "texto-inactivo-bold"}">${u.activo ? "ACTIVO" : "INACTIVO"}</span></td>
        <td style="display: flex; gap: 8px;">
            <!-- Botón 1: Banear / Desbanear -->
            <button onclick="modificarUsuario(${u.id}, ${!u.activo}, '${u.rol}')" class="btn-detalles">${textoBotonEstado}</button>
            
            <!-- Botón 2: Dar / Quitar Admin (Pintado de color oscuro para diferenciarlo) -->
            <button onclick="modificarUsuario(${u.id}, ${u.activo}, '${nuevoRol}')" class="btn-detalles" style="border-color: #1a1a1a; color: #1a1a1a;">${textoBotonRol}</button>
        </td>`;
            tbody.appendChild(fila);
        });
    } catch (e) {
        console.error("Error al cargar usuarios de la administración:", e);
    }
}

// Función maestra para cambiar tanto el estado (ban) como el rol (admin/usuario)
async function modificarUsuario(id, estadoNuevo, rolNuevo) {
    const confirmacion = confirm(`¿Estás seguro de guardar estos cambios en el usuario?`);
    
    if (!confirmacion) return;

    try {
        const res = await fetch("http://localhost:3000/api/admin/usuario/update", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            // Enviamos SIEMPRE ambos datos para no borrar información por accidente
            body: JSON.stringify({ id: id, activo: estadoNuevo, rol: rolNuevo }),
        });

        if (res.ok) {
            // Recarga la tabla al instante para mostrar el cambio en verde/rojo
            cargarUsuarios(); 
        } else {
            const errorData = await res.json();
            alert("Error: " + (errorData.error || "No se pudo actualizar el usuario."));
        }
    } catch (error) {
        console.error("Error al modificar usuario:", error);
        alert("Error de conexión. Verifica que el servidor de Node.js esté encendido.");
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
                const errorData = await res.json();
                alert("Error de la Base de Datos:\n" + (errorData.error || "Datos inválidos."));
            }
        } catch (err) {
            console.error("Error en la petición de administración:", err);
            alert("Error de conexión. Verifica que el servidor de Node.js esté encendido.");
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

            // --- LÓGICA DE DESCUENTOS AÑADIDA AQUÍ ---
            let htmlEtiquetaDescuento = '';
            let htmlPrecio = `Desde S/ ${destino.precio_grupal}`;
            
            if (destino.con_descuento && destino.porcentaje_descuento > 0) {
                let precioDescuento = (destino.precio_grupal - (destino.precio_grupal * destino.porcentaje_descuento / 100)).toFixed(2);
                
                // Reutilizamos tu clase de CSS de descuentos ajustándola al tamaño de esta tarjeta pequeña
                htmlEtiquetaDescuento = `<span class="etiqueta-descuento" style="top: 10px; left: 10px; font-size: 0.75rem; padding: 4px 10px;">-${destino.porcentaje_descuento}% OFF</span>`;
                htmlPrecio = `Desde <span style="text-decoration: line-through; color: #999; font-size: 0.85rem; margin: 0 5px;">S/ ${destino.precio_grupal}</span> S/ ${precioDescuento}`;
            }
            // -----------------------------------------

            const card = document.createElement('div');
            card.className = 'card-favorito';
            card.innerHTML = `
                <div class="imagen-favorito">
                    ${htmlEtiquetaDescuento} <!-- Insertamos la etiqueta flotante -->
                    
                    <button class="btn-corazon" onclick="manejarFavoritoClick(event, this, ${destino.id}); setTimeout(() => cargarFavoritosUsuario(${idUsuario}), 200);">
                        <i class="fa-solid fa-heart"></i>
                    </button>
                    <a href="Detalles/Detalle.html?id=${destino.id}">
                        <img src="${destino.imagen_url}" alt="${destino.titulo}">
                    </a>
                </div>
                <div style="padding: 15px;">
                    <h4 style="margin-bottom: 5px; color: #1a1a1a;">${destino.titulo}</h4>
                    <p style="color: #e51d2a; font-weight: bold;">${htmlPrecio}</p> <!-- Insertamos el precio calculado -->
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
// Cargar Perfil
window.cargarDatosPerfil = async function() {
    const idUsuario = sessionStorage.getItem("idUsuario");
    if (!idUsuario) return;
    try {
        const res = await fetch(`http://localhost:3000/api/usuarios/${idUsuario}`);
        if (res.ok) {
            const data = await res.json();
            document.getElementById('conf-nombre').value = data.nombre || '';
            document.getElementById('conf-tel').value = data.telefono || '';
            
            // Cargamos la foto
            const inputAvatar = document.getElementById('conf-avatar');
            const preview = document.getElementById('preview-avatar');
            if (inputAvatar) inputAvatar.value = data.avatar_url || '';
            if (preview) preview.src = data.avatar_url || 'https://res.cloudinary.com/dsk6vsr0c/image/upload/v1782863989/noimagen.png';
        }
    } catch (error) { console.error("Error al cargar perfil:", error); }
};

// Guardar Perfil
window.guardarCambiosPerfil = async function() {
    const idUsuario = sessionStorage.getItem("idUsuario");
    if (!idUsuario) return;
    
    const boton = document.getElementById('btn-guardar-perfil');
    boton.innerText = 'Guardando...';
    boton.disabled = true;
    
    const nuevoNombre = document.getElementById('conf-nombre').value.trim();
    const nuevoTel = document.getElementById('conf-tel').value.trim();
    const nuevaPasswordInput = document.getElementById('conf-password');
    const nuevaPassword = nuevaPasswordInput ? nuevaPasswordInput.value.trim() : '';
    // Capturamos el link de la foto
    const nuevoAvatarInput = document.getElementById('conf-avatar');
    const nuevoAvatar = nuevoAvatarInput ? nuevoAvatarInput.value.trim() : '';

    if (!nuevoNombre) {
        alert("El nombre no puede estar vacío.");
        boton.innerText = 'Guardar Cambios';
        boton.disabled = false; return;
    }

    const payload = { nombre: nuevoNombre, telefono: nuevoTel, avatar_url: nuevoAvatar };
    if (nuevaPassword !== "") payload.password = nuevaPassword;

    try {
        const res = await fetch(`http://localhost:3000/api/usuarios/${idUsuario}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) {
            alert("¡Tus datos han sido actualizados!");
            sessionStorage.setItem("usuarioLogueado", nuevoNombre);
            sessionStorage.setItem("avatarUsuario", nuevoAvatar); // Guardamos en memoria
            
            if (nuevaPasswordInput) nuevaPasswordInput.value = '';
            location.reload(); // Recargamos para que las fotos se actualicen en toda la web
        } else { alert("Error al guardar."); }
    } catch (error) { alert("Error de conexión."); } 
    finally { boton.innerText = 'Guardar Cambios'; boton.disabled = false; }
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
//Plantilla Itinerario de Informacion
document.addEventListener('DOMContentLoaded', async () => {
    const contenedorDinamico = document.getElementById('pagina-informacion-dinamica');
    if (!contenedorDinamico) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) {
        window.location.href = '../Destino.html';
        return;
    }
    try {
        const res = await fetch(`http://localhost:3000/api/destinos/${id}`);
        const d = await res.json();
        document.title = `Itinerario ${d.titulo} | Turismo Ica`;
        document.getElementById('info-titulo-header').innerText = `Itinerario: ${d.titulo}`;
        document.getElementById('info-titulo-destino').innerText = d.titulo;
        document.getElementById('info-desc-destino').innerText = d.descripcion_corta || 'Descubre la magia de este destino paso a paso.';
        document.getElementById('info-portada').style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${d.imagen_url})`;
        document.getElementById('info-btn-reservar').href = `../Detalles/Detalle.html?id=${d.id}`;
        const listaItinerario = document.getElementById('lista-itinerario-dinamico');
        listaItinerario.innerHTML = '';
        if (d.itinerarios && d.itinerarios.length > 0) {
            d.itinerarios.forEach(paso => {
                listaItinerario.innerHTML += `
                    <li>
                        <div class="texto-hora-resaltada">${paso.hora}</div>
                        <div>
                            <h3>${paso.titulo}</h3>
                            <p>${paso.descripcion}</p>
                        </div>
                    </li>
                `;
            });
        } else {
            listaItinerario.innerHTML = '<p style="color: #666;">El itinerario se está actualizando y estará disponible pronto.</p>';
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
        for (const [clave, url] of Object.entries(mapasGuia)) {
            if (d.titulo.toLowerCase().includes(clave)) {
                urlMapaFinal = url;
                break;
            }
        }
        document.getElementById('info-mapa-img').src = urlMapaFinal;

    } catch (error) {
        console.error("Error al cargar itinerario dinámico:", error);
        document.getElementById('lista-itinerario-dinamico').innerHTML = '<p style="color: #e51d2a;">Error de red al conectar con la base de datos.</p>';
    }
});

//Buscardor en destino
document.addEventListener('DOMContentLoaded', () => {
    const buscador = document.getElementById('buscador-destinos');
    if (buscador) {
        buscador.addEventListener('input', (e) => {
            const textoBusqueda = e.target.value.toLowerCase().trim();
            const tarjetas = document.querySelectorAll('.cuadrito-viaje');
            if(textoBusqueda.length > 0) {
                document.querySelectorAll('.btn-filtro').forEach(btn => btn.classList.remove('activo'));
                const btnTodos = document.querySelector('.btn-filtro[data-filtro="todos"]');
                if(btnTodos) btnTodos.classList.add('activo');
            }
            tarjetas.forEach(tarjeta => {
                const tituloElemento = tarjeta.querySelector('.textos-del-viaje h3');
                if (!tituloElemento) return;
                const titulo = tituloElemento.textContent.toLowerCase();
                if (titulo.includes(textoBusqueda)) {
                    tarjeta.classList.remove('oculto');
                } else {
                    tarjeta.classList.add('oculto');
                }
            });
        });
        const botonesFiltro = document.querySelectorAll('.btn-filtro');
        botonesFiltro.forEach(boton => {
            boton.addEventListener('click', () => {
                buscador.value = '';
            });
        });
    }
});

//Pagina de reseñas
let reseñasGlobalesMemoria = []; // Memoria para filtros rápidos

// Inicializador al entrar a la página
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("contenedor-reseñas-dinamicas")) {
        cargarReseñasGlobales();
    }
});

async function cargarReseñasGlobales() {
    try {
        const res = await fetch("http://localhost:3000/api/comentarios");
        const reseñas = await res.json();
        
        // Guardamos en memoria global
        reseñasGlobalesMemoria = reseñas;
        
        dibujarPanelEstadistico(reseñas);
        dibujarGrillaReseñas(reseñas);
        
    } catch (error) {
        console.error("Error al cargar reseñas:", error);
    }
}

function dibujarPanelEstadistico(reseñas) {
    const contenedor = document.getElementById("bloque-estadisticas");
    if (!contenedor || reseñas.length === 0) {
        if(contenedor) contenedor.innerHTML = "<p>Aún no hay reseñas registradas.</p>";
        return;
    }

    let sumaEstrellas = 0;
    let conteo = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const total = reseñas.length;

    reseñas.forEach(r => {
        const stars = parseInt(r.estrellas) || 5;
        sumaEstrellas += stars;
        conteo[stars] = (conteo[stars] || 0) + 1;
    });

    const promedio = (sumaEstrellas / total).toFixed(2);
    
    // Generar estrellas visuales del promedio
    const promInt = Math.round(promedio);
    let htmlEstrellas = '';
    for(let i=0; i<5; i++) {
        htmlEstrellas += `<i class="fa-solid fa-star" style="color: ${i < promInt ? 'var(--color-boton)' : '#ccc'}"></i> `;
    }

    // Calcular porcentajes para las barras
    let htmlBarras = '';
    for(let i=5; i>=1; i--) {
        const porcentaje = ((conteo[i] / total) * 100).toFixed(1);
        htmlBarras += `
            <div class="fila-barra-progreso">
                <span class="etiqueta-star">${i}★</span>
                <div class="pista-barra">
                    <div class="relleno-barra" style="width: ${porcentaje}%;"></div>
                </div>
                <span class="porcentaje-texto">${porcentaje}%</span>
            </div>
        `;
    }

    contenedor.innerHTML = `
        <div class="bloque-promedio">
            <h2>${promedio} <span>/ 5</span></h2>
            <div class="estrellas-promedio">${htmlEstrellas}</div>
            <p style="color: #666; font-size: 0.9rem;">${promedio} de 5 estrellas (basado en ${total} reseñas)</p>
        </div>
        <div class="bloque-barras">
            <p style="font-weight: 700; margin-bottom: 10px; color: #1a1a1a;">${promedio} / 5 (${total} opiniones)</p>
            ${htmlBarras}
        </div>
    `;
}

function dibujarGrillaReseñas(reseñasLista) {
    const contenedor = document.getElementById("contenedor-reseñas-dinamicas");
    if (!contenedor) return;

    contenedor.innerHTML = '';

    if (reseñasLista.length === 0) {
        contenedor.innerHTML = '<p style="text-align:center; color:#666;">No se encontraron resultados.</p>';
        return;
    }

    reseñasLista.forEach(r => {
        // Datos seguros
        const destino = r.destinos ? r.destinos.titulo : "Tour en Ica";
        const usuario = r.usuarios ? r.usuarios.nombre : "Viajero Anónimo";
        const estrellasNum = parseInt(r.estrellas) || 5;
        
        // Transformar la fecha cruda de la base de datos a formato DD/MM/YYYY
        let fechaFormateada = "Hace unos días";
        if (r.fecha) {
            const fechaObj = new Date(r.fecha);
            // El padStart(2, '0') asegura que si es día "7" se escriba "07"
            const dia = String(fechaObj.getDate()).padStart(2, '0');
            const mes = String(fechaObj.getMonth() + 1).padStart(2, '0'); 
            const anio = fechaObj.getFullYear();
            fechaFormateada = `${dia}/${mes}/${anio}`;
        }

        // Pintar estrellas rojas
        let htmlStars = '';
        for(let i=0; i<estrellasNum; i++) htmlStars += '<i class="fa-solid fa-star"></i>';

        const card = document.createElement("article");
        card.className = "card-reseña-item";
        card.innerHTML = `
            <div class="header-card-reseña">
                <div class="titulo-destino-card">${destino}</div>
                <div class="estrellas-rojas-card">${htmlStars}</div>
            </div>
            <div class="texto-comentario-card">${r.texto}</div>
            <div class="footer-card-reseña">
                ${fechaFormateada} por <strong>${usuario}</strong>
            </div>
        `;
        contenedor.appendChild(card);
    });
}

// Lógica del filtro en vivo
window.filtrarReseñasGlobales = function() {
    const txtFiltro = document.getElementById("buscador-reseñas").value.toLowerCase();
    const starFiltro = document.getElementById("filtro-estrellas").value;

    const filtradas = reseñasGlobalesMemoria.filter(r => {
        const destino = r.destinos ? r.destinos.titulo.toLowerCase() : "";
        const texto = r.texto ? r.texto.toLowerCase() : "";
        const matchTexto = destino.includes(txtFiltro) || texto.includes(txtFiltro);
        
        const matchStars = starFiltro === "" || r.estrellas == starFiltro;

        return matchTexto && matchStars;
    });

    dibujarGrillaReseñas(filtradas);
};

// Función para LEER las consultas en Perfil.html (Vista del Usuario)
window.cargarConsultasUsuario = async function(idUsuario) {
    const contenedor = document.getElementById("contenedor-consultas-usuario");
    if (!contenedor) return;

    contenedor.innerHTML = '<p style="color: #666;">Cargando tus mensajes...</p>';

    try {
        const res = await fetch(`http://localhost:3000/api/consultas/usuario/${idUsuario}`);
        const consultas = await res.json();

        if (consultas.length === 0) {
            contenedor.innerHTML = '<p style="color: #666;">No has enviado ninguna consulta aún.</p>';
            return;
        }

        let html = '';
        consultas.forEach(c => {
            const esRespondido = c.estado === 'respondido';
            // Usamos las mismas clases CSS que programamos para el Admin (Rojo y Verde)
            const claseCard = esRespondido ? 'card-consulta respondido' : 'card-consulta';
            const etiquetaEstado = esRespondido
                ? `<span style="background:#2e7d32; color:white; padding:4px 10px; border-radius:12px; font-size:0.8rem; font-weight:bold;">RESPONDIDO</span>`
                : `<span style="background:#e51d2a; color:white; padding:4px 10px; border-radius:12px; font-size:0.8rem; font-weight:bold;">EN ESPERA</span>`;

            let zonaRespuesta = "";

            if (esRespondido) {
                zonaRespuesta = `
                    <div class="respuesta-admin-caja">
                        <strong><i class="fa-solid fa-headset"></i> Respuesta de Turismo Ica:</strong>
                        <p style="margin-top:5px; color:#1a1a1a;">${c.respuesta}</p>
                    </div>
                `;
            } else {
                zonaRespuesta = `
                    <div style="margin-top: 15px; color: #888; font-size: 0.9rem; font-style: italic;">
                        <i class="fa-regular fa-clock"></i> Nuestro equipo responderá pronto a tu mensaje.
                    </div>
                `;
            }

            html += `
                <div class="${claseCard}">
                    <div class="card-consulta-header">
                        <div>
                            <strong style="font-size:1.1rem;">Consulta #${c.id}</strong>
                        </div>
                        <div>${etiquetaEstado}</div>
                    </div>
                    <div class="mensaje-cliente-caja">
                        <strong style="color:var(--color-boton); font-size:0.85rem;">TÚ ESCRIBISTE:</strong><br>
                        <span style="color:#555;">${c.mensaje}</span>
                    </div>
                    ${zonaRespuesta}
                </div>
            `;
        });
        contenedor.innerHTML = html;
    } catch (err) {
        console.error(err);
        contenedor.innerHTML = '<p style="color: red;">Error al cargar tus consultas. Verifica tu conexión.</p>';
    }
};

// Función para alternar el modo oscuro y guardar la preferencia en localStorage
document.addEventListener("DOMContentLoaded", () => {
    const btnTema = document.getElementById("btn-modo-oscuro");
    const temaGuardado = localStorage.getItem("temaTurismoIca");
    
    // Si el usuario ya había elegido modo oscuro antes, lo activamos automáticamente
    if (temaGuardado === "oscuro") {
        document.body.classList.add("dark-mode");
        if(btnTema) btnTema.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
});

// Función que se ejecuta al presionar el botón flotante
window.toggleModoOscuro = function() {
    const body = document.body;
    const btnTema = document.getElementById("btn-modo-oscuro");
    
    // Alterna la clase dark-mode en el cuerpo de la página
    body.classList.toggle("dark-mode");
    
    // Verifica si se activó o desactivó y guarda la preferencia en la memoria del navegador
    if (body.classList.contains("dark-mode")) {
        localStorage.setItem("temaTurismoIca", "oscuro");
        if(btnTema) btnTema.innerHTML = '<i class="fa-solid fa-sun"></i>'; // Cambia ícono a sol
    } else {
        localStorage.setItem("temaTurismoIca", "claro");
        if(btnTema) btnTema.innerHTML = '<i class="fa-solid fa-moon"></i>'; // Cambia ícono a luna
    }
};

// Eventos para manejar el modo oscuro al imprimir
window.addEventListener('beforeprint', () => {
    // Justo antes de que el navegador abra la ventana de imprimir/PDF, quitamos el modo oscuro
    document.body.classList.remove('dark-mode');
});

window.addEventListener('afterprint', () => {
    // Al cerrar la ventana (ya sea que guardó o canceló), verificamos si usaba modo oscuro y lo devolvemos
    if (localStorage.getItem("temaTurismoIca") === "oscuro") {
        document.body.classList.add('dark-mode');
    }
});