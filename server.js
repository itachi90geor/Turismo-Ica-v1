const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

//Configuración de Supabase
const supabaseUrl = 'https://euseuaxftelzcsvgfpcu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1c2V1YXhmdGVsemNzdmdmcGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMTgyMTQsImV4cCI6MjA5MzY5NDIxNH0.HvBVxPFhAuHZLLlbgcHbAnfj8WJPpF_prLc_ajLNmQM';
const supabase = createClient(supabaseUrl, supabaseKey);

//Verificación de conexión a Supabase rol y estado
app.post('/api/registro', async (req, res) => {
    const { nombre, telefono, dni, email, password } = req.body;
    const { data, error } = await supabase
        .from('usuarios')
        .insert([{
            nombre,
            telefono,
            dni,
            email,
            password,
            rol: 'usuario',
            activo: true
        }]);
    if (error) {
        console.error("Error al registrar:", error.message);
        return res.status(500).json({ error: error.message });
    }
    res.status(200).json({ mensaje: '¡Usuario registrado con éxito en Supabase!' });
});

//Verificacion de Login
app.post('/api/login', async (req, res) => {
    const email = req.body.email ? req.body.email.trim() : "";
    const password = req.body.password ? req.body.password.trim() : "";
    console.log(`INTENTO DE LOGIN: [${email}]`);
    const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .ilike('email', email)
        .eq('password', password)
        .single();
    if (error || !data) {
        return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }
    if (data.activo === false) {
        return res.status(403).json({ error: 'Cuenta desactivada.' });
    }
    res.status(200).json({
        mensaje: 'Login exitoso',
        usuario: data.nombre,
        idUsuario: data.id,
        rol: data.rol,
        avatar_url: data.avatar_url
    });
});

//Rutas de Reservas: Registrar una nueva reserva
app.post('/api/reservas', async (req, res) => {
    const { usuario_id, destino_id, modalidad, fecha_reserva, pasajeros, total, metodo_pago, estado } = req.body;
    const { data, error } = await supabase
        .from('reservas')
        .insert([{
            usuario_id,
            destino_id,
            modalidad,
            fecha_reserva,
            pasajeros,
            total,
            metodo_pago,
            estado
        }]);
    if (error) {
        console.error("Error al registrar reserva en BD:", error.message);
        return res.status(500).json({ error: error.message });
    }
    res.status(200).json({ mensaje: 'Reserva registrada con éxito en Supabase' });
});

// Rutas de Reservas: Obtener todas las reservas de un usuario específico
app.get('/api/reservas/usuario/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase
        .from('reservas')
        .select(`
            *,
            destinos ( titulo, imagen_url )
        `)
        .eq('usuario_id', id)
        .order('id', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
});

//Mensaje para indicar que el servidor está corriendo y conectado a Supabase
app.listen(3000, () => {
    console.log('Conectado a la nube de Supabase para Turismo Ica');
});

//Admin
//Gestion de Usuarios: Obtener lista completa de usuarios para el panel Admin
app.get('/api/admin/usuarios', async (req, res) => {
    const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, email, rol, activo, fecha_registro')
        .order('id', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
});
//Gestion de Usuarios: Actualizar estado y visualizar rol de un usuario
app.put('/api/admin/usuario/update', async (req, res) => {
    const { id, activo, rol } = req.body;
    const { data, error } = await supabase
        .from('usuarios')
        .update({ activo, rol })
        .eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json({ mensaje: 'Estado del usuario actualizado correctamente' });
});
//Cambiar estado de un destino (Activo/Inactivo) para el panel Admin
app.put('/api/admin/destinos/estado', async (req, res) => {
    const { id, activo } = req.body;
    const { data, error } = await supabase
        .from('destinos')
        .update({ activo })
        .eq('id', id);
    if (error) {
        console.error("Error al cambiar estado del destino:", error.message);
        return res.status(500).json({ error: error.message });
    }
    res.status(200).json({ mensaje: 'Estado del destino actualizado con éxito' });
});

//Gestion de Destinos: Obtener lista completa de destinos para el panel Admin
app.get('/api/admin/destinos', async (req, res) => {
    const { data, error } = await supabase
        .from('destinos')
        .select('*')
        .order('id', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
});
//Editar un destino existente (Incluyendo su itinerario) para el panel Admin
app.put('/api/admin/destinos/:id', async (req, res) => {
    const { id } = req.params;
    const {
        titulo, precio_grupal, precio_privado, descripcion_corta,
        descripcion_larga, ubicacion, con_descuento, porcentaje_descuento,
        imagen_url, dias_programados, itinerario
    } = req.body;
    const { error: errorDestino } = await supabase
        .from('destinos')
        .update({
            titulo, precio_grupal, precio_privado, descripcion_corta,
            descripcion_larga, ubicacion, con_descuento, porcentaje_descuento,
            imagen_url, dias_programados
        })
        .eq('id', id);
    if(errorDestino) return res.status(500).json({ error: errorDestino.message });
    if (itinerario && Array.isArray(itinerario)) {
        await supabase.from('itinerarios').delete().eq('destino_id', id);
        if (itinerario.length > 0) {
            const inserts = itinerario.map((item, index) => ({
                destino_id: id,
                hora: item.hora,
                titulo: item.titulo,
                descripcion: item.descripcion,
                orden: index + 1
            }));
            await supabase.from('itinerarios').insert(inserts);
        }
    }
    res.status(200).json({ mensaje: 'Éxito' });
});

app.post('/api/admin/destinos', async (req, res) => {
    const {
        titulo, precio_grupal, precio_privado, descripcion_corta,
        descripcion_larga, ubicacion, con_descuento, porcentaje_descuento,
        imagen_url, dias_programados, categoria, itinerario,
        imagenes_galeria
    } = req.body;
    const urlSegura = imagen_url && imagen_url.trim() !== "" 
        ? imagen_url 
        : "https://res.cloudinary.com/dsk6vsr0c/image/upload/v1782863989/noimagen.png";
    const { data, error } = await supabase
        .from('destinos')
        .insert([{
            titulo, 
            precio_grupal: parseFloat(precio_grupal) || 0,
            precio_privado: parseFloat(precio_privado) || 0, 
            descripcion_corta,
            descripcion_larga, 
            ubicacion, 
            con_descuento: con_descuento || false,
            porcentaje_descuento: parseInt(porcentaje_descuento) || 0,
            imagen_url: urlSegura, 
            dias_programados, 
            categoria: categoria || 'todos',
            activo: true
        }]).select(); 
    if (error) {
        console.error("Error BD Destinos:", error.message);
        return res.status(500).json({ error: error.message });
    }
    const nuevoId = data[0].id;
    if (itinerario && Array.isArray(itinerario) && itinerario.length > 0) {
        const insertsItinerario = itinerario.map((item, index) => ({
            destino_id: nuevoId,
            hora: item.hora,
            titulo: item.titulo,
            descripcion: item.descripcion,
            orden: index + 1
        }));
        await supabase.from('itinerarios').insert(insertsItinerario);
    }
    if (imagenes_galeria && Array.isArray(imagenes_galeria) && imagenes_galeria.length > 0) {
        const insertsGaleria = imagenes_galeria.map((url) => ({
            destino_id: nuevoId,
            url: url
        }));
        await supabase.from('imagenes_destino').insert(insertsGaleria);
    }
    res.status(200).json({ mensaje: 'Destino, itinerario y galería creados con éxito' });
});

// Gestion de Reservas: Obtener lista completa de reservas para el panel Admin
app.get('/api/admin/reservas', async (req, res) => {
    const { data, error } = await supabase
        .from('reservas')
        .select(`
            *,
            usuarios ( nombre, email ),
            destinos ( titulo )
        `)
        .order('id', { ascending: false });
    if (error) {
        console.error("Error al obtener reservas globales:", error.message);
        return res.status(500).json({ error: error.message });
    }
    res.status(200).json(data);
});

//Boton de Favoritos: Toggle (Agregar/Quitar) un destino a favoritos
app.post('/api/favoritos/toggle', async (req, res) => {
    const { usuario_id, destino_id } = req.body;
    const { data: existente } = await supabase
        .from('favoritos')
        .select('*')
        .eq('usuario_id', usuario_id)
        .eq('destino_id', destino_id)
        .single();
    if (existente) {
        await supabase.from('favoritos').delete().eq('id', existente.id);
        return res.status(200).json({ esFavorito: false });
    } else {
        await supabase.from('favoritos').insert([{ usuario_id, destino_id }]);
        return res.status(200).json({ esFavorito: true });
    }
});

//Se obtienen los IDs de los destinos favoritos de un usuario específico 
app.get('/api/favoritos/ids/:usuario_id', async (req, res) => {
    const { usuario_id } = req.params;
    const { data, error } = await supabase
        .from('favoritos')
        .select('destino_id')
        .eq('usuario_id', usuario_id);
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data.map(f => f.destino_id));
});

//Se obtienen los destinos favoritos completos de un usuario específico por su ID, incluyendo detalles del destino
app.get('/api/favoritos/usuario/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase
        .from('favoritos')
        .select(`
            destino_id,
            destinos (*) 
        `)
        .eq('usuario_id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
});

//Publica
//Lista de destinos activos para mostrar en la página principal y en la sección de destinos
app.get('/api/destinos', async (req, res) => {
    const { data, error } = await supabase
        .from('destinos')
        .select('*')
        .eq('activo', true);
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
});

app.get('/api/destinos/destacados', async (req, res) => {
    try {
        const { data: destinos, error: errDest } = await supabase.from('destinos').select('*').eq('activo', true);
        if (errDest) throw errDest;
        const { data: reservas, error: errRes } = await supabase.from('reservas').select('destino_id');
        if (errRes) throw errRes;
        const { data: favoritos, error: errFav } = await supabase.from('favoritos').select('destino_id');
        if (errFav) throw errFav;
        const conteoReservas = {};
        reservas.forEach(r => {
            conteoReservas[r.destino_id] = (conteoReservas[r.destino_id] || 0) + 1;
        });
        const conteoFavoritos = {};
        favoritos.forEach(f => {
            conteoFavoritos[f.destino_id] = (conteoFavoritos[f.destino_id] || 0) + 1;
        });
        const destinosMapeados = destinos.map(d => ({
            ...d,
            reservasCount: conteoReservas[d.id] || 0,
            favoritosCount: conteoFavoritos[d.id] || 0
        }));
        destinosMapeados.sort((a, b) => {
            if (b.reservasCount !== a.reservasCount) {
                return b.reservasCount - a.reservasCount;
            }
            return b.favoritosCount - a.favoritosCount;
        });
        const topDestinos = destinosMapeados.slice(0, 3);
        res.status(200).json(topDestinos);
    } catch (error) {
        console.error("Error al calcular destacados:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Detalle de un destino específico, incluyendo comentarios, imágenes y itinerario
// Detalle de un destino específico, incluyendo comentarios, imágenes y itinerario
app.get('/api/destinos/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase
        .from('destinos')
        .select(`
            *,
            comentarios ( id, texto, estrellas, fecha, usuario_id, usuarios ( nombre ) ),
            imagenes_destino ( url ),
            itinerarios ( id, hora, titulo, descripcion, orden )
        `)
        .eq('id', id)
        .single();
        
    if (error) return res.status(500).json({ error: error.message });
    
    if (data && data.itinerarios) {
        data.itinerarios.sort((a, b) => a.orden - b.orden);
    }
    res.status(200).json(data);
});
// Actualizar (Editar) un comentario existente
app.put('/api/comentarios/:id', async (req, res) => {
    const { id } = req.params;
    const { texto, estrellas } = req.body;
    const { data, error } = await supabase
        .from('comentarios')
        .update({ texto, estrellas })
        .eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json({ mensaje: 'Comentario actualizado con éxito' });
});

//Perfil de Usuario
//Obtener los datos del perfil de un usuario específico por su ID
app.get('/api/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase
        .from('usuarios')
        .select('nombre, telefono, avatar_url, rol') // <--- Añadimos 'rol' aquí
        .eq('id', id)
        .single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
});

//Guardar cambios en el perfil de un usuario específico por su ID
app.put('/api/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, telefono, password, avatar_url } = req.body; 
    
    const datosAActualizar = { nombre, telefono };
    
    if (password && password.trim() !== "") {
        datosAActualizar.password = password.trim();
    }
    // Si envían una URL de foto, la preparamos para guardar
    if (avatar_url !== undefined) {
        datosAActualizar.avatar_url = avatar_url;
    }

    const { data, error } = await supabase
        .from('usuarios')
        .update(datosAActualizar)
        .eq('id', id);
        
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    res.status(200).json({ mensaje: 'Perfil actualizado con éxito' });
});

// Obtener todas las reseñas globales con nombre de usuario y destino
app.get('/api/comentarios', async (req, res) => {
    const { data, error } = await supabase
        .from('comentarios')
        .select(`
            id, texto, estrellas, fecha,
            usuarios ( nombre ),
            destinos ( titulo )
        `)
        .order('id', { ascending: false }); // Las más recientes primero

    if (error) {
        console.error("Error al obtener comentarios:", error.message);
        return res.status(500).json({ error: error.message });
    }
    res.status(200).json(data);
});

//Sistema de consultas: Crear, Obtener y Responder consultas de usuarios

// 1. Crear una nueva consulta (Desde Nosotros.html)
app.post('/api/consultas', async (req, res) => {
    const { usuario_id, nombre, email, mensaje } = req.body;
    const { data, error } = await supabase
        .from('consultas')
        .insert([{ usuario_id, nombre, email, mensaje, estado: 'pendiente' }]);
    
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json({ mensaje: 'Consulta enviada con éxito' });
});

// 2. Obtener todas las consultas para el Admin
app.get('/api/admin/consultas', async (req, res) => {
    const { data, error } = await supabase
        .from('consultas')
        .select('*')
        .order('estado', { ascending: true }) // Ordena: primero "pendiente", luego "respondido"
        .order('id', { ascending: false });
        
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
});

// 3. Responder a una consulta (Desde el Panel Admin)
app.put('/api/admin/consultas/:id', async (req, res) => {
    const { id } = req.params;
    const { respuesta } = req.body;
    const { error } = await supabase
        .from('consultas')
        .update({ respuesta, estado: 'respondido' })
        .eq('id', id);
        
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json({ mensaje: 'Respuesta enviada' });
});

// 4. Obtener las consultas de un usuario específico (Para Perfil.html)
app.get('/api/consultas/usuario/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase
        .from('consultas')
        .select('*')
        .eq('usuario_id', id)
        .order('id', { ascending: false });
        
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
});