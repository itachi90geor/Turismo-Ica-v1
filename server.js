const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 1. CONFIGURACIÓN DE SUPABASE (Cuidado con no duplicar el URL)
const supabaseUrl = 'https://euseuaxftelzcsvgfpcu.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1c2V1YXhmdGVsemNzdmdmcGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMTgyMTQsImV4cCI6MjA5MzY5NDIxNH0.HvBVxPFhAuHZLLlbgcHbAnfj8WJPpF_prLc_ajLNmQM'; // Tu llave de la captura
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. RUTA PARA REGISTRAR (Con Rol y Estado Activo)
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
            rol: 'usuario', // Valor por defecto
            activo: true    // Valor por defecto
        }]);

    if (error) {
        console.error("Error al registrar:", error.message);
        return res.status(500).json({ error: error.message });
    }
    res.status(200).json({ mensaje: '¡Usuario registrado con éxito en Supabase!' });
});

// --- MODIFICACIÓN EN SERVER.JS ---
// --- RUTA DE LOGIN COMPLETA EN SERVER.JS ---
app.post('/api/login', async (req, res) => {
    const email = req.body.email ? req.body.email.trim() : "";
    const password = req.body.password ? req.body.password.trim() : "";

    console.log(`INTENTO DE LOGIN: [${email}]`);

    const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .ilike('email', email) // Ignora mayúsculas/minúsculas
        .eq('password', password)
        .single();

    if (error || !data) {
        return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    if (data.activo === false) {
        return res.status(403).json({ error: 'Cuenta desactivada.' });
    }

    // Enviamos los datos necesarios al frontend
    res.status(200).json({ 
        mensaje: 'Login exitoso', 
        usuario: data.nombre,
        idUsuario: data.id, 
        rol: data.rol 
    });
});

// ==========================================
//    --- NUEVA RUTA: GUARDAR RESERVAS ---
// ==========================================
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

// ==========================================
//    --- NUEVA RUTA: OBTENER VIAJES DEL USUARIO ---
// ==========================================
app.get('/api/reservas/usuario/:id', async (req, res) => {
    const { id } = req.params;
    
    // El select mágico: Trae la reserva y cruza los datos con la tabla destinos
    const { data, error } = await supabase
        .from('reservas')
        .select(`
            *,
            destinos ( titulo, imagen_url )
        `)
        .eq('usuario_id', id)
        .order('id', { ascending: false }); // Usamos el ID para ordenar de más nuevo a más viejo

    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
});

// 4. INICIO DEL SERVIDOR (Este es el mensaje que debe salir)
app.listen(3000, () => {
    console.log('---------------------------------------------------------');
    console.log('Servidor Backend corriendo en http://localhost:3000');
    console.log('Conectado a la nube de Supabase para Turismo Ica');
    console.log('---------------------------------------------------------');
});

/// ==========================================
//    --- RUTAS EXCLUSIVAS DE ADMIN ---
// ==========================================

// 1. GESTIÓN DE USUARIOS: Obtener todos los usuarios de la base de datos
app.get('/api/admin/usuarios', async (req, res) => {
    const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, email, rol, activo, fecha_registro')
        .order('id', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
});

// 2. GESTIÓN DE USUARIOS: Activar/Desactivar o cambiar el rango (Admin/Usuario)
// ... (Código anterior de app.get('/api/admin/usuarios') igual) ...

// 2. GESTIÓN DE USUARIOS: Activar/Desactivar o cambiar el rango (Admin/Usuario)
app.put('/api/admin/usuario/update', async (req, res) => {
    const { id, activo, rol } = req.body;

    const { data, error } = await supabase
        .from('usuarios')
        .update({ activo, rol })
        .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json({ mensaje: 'Estado del usuario actualizado correctamente' });
});

// === NUEVA RUTA: GESTIÓN DE DESTINOS (ACTIVAR / DESACTIVAR EN BD) ===
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

// 3. GESTIÓN DE DESTINOS: Obtener lista completa para las "líneas rectangulares" del Admin
app.get('/api/admin/destinos', async (req, res) => {
    const { data, error } = await supabase
        .from('destinos')
        .select('*')
        .order('id', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
});

// ... (Código anterior de app.get('/api/admin/destinos') igual) ...

// 4. GESTIÓN DE DESTINOS: Editar TODO (Descripción, Precios, Descuentos e Imágenes)
app.put('/api/admin/destinos/:id', async (req, res) => {
    const { id } = req.params;
    const { 
        titulo, precio_grupal, precio_privado, descripcion_corta, 
        descripcion_larga, ubicacion, con_descuento, porcentaje_descuento,
        imagen_url, imagenes_galeria, dias_programados 
    } = req.body;

    const { error: errorDestino } = await supabase
        .from('destinos')
        .update({ 
            titulo, precio_grupal, precio_privado, descripcion_corta, 
            descripcion_larga, ubicacion, con_descuento, porcentaje_descuento, 
            imagen_url, dias_programados 
        })
        .eq('id', id);
    
    res.status(200).json({ mensaje: 'Éxito' });
});

// === AQUÍ COLOCAS LA NUEVA RUTA POST (AÑADIDA) ===
app.post('/api/admin/destinos', async (req, res) => {
    const { 
        titulo, precio_grupal, precio_privado, descripcion_corta, 
        descripcion_larga, ubicacion, con_descuento, porcentaje_descuento,
        imagen_url, dias_programados, categoria 
    } = req.body;

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
            imagen_url, 
            dias_programados,
            categoria: categoria || 'todos'
        }]);

    if (error) {
        console.error("Error al crear destino en Supabase:", error.message);
        return res.status(500).json({ error: error.message });
    }
    res.status(200).json({ mensaje: 'Destino creado con éxito en la nube' });
});

// 5. GESTIÓN DE RESERVAS: Ruta inicial para que no salga error al entrar a la pestaña
app.get('/api/admin/reservas', async (req, res) => {
    res.status(200).json({ mensaje: "Módulo de reservas listo para recibir datos" });
});

// ... (El resto del archivo app.get('/api/destinos') continúa igual abajo) ...

// ==========================================
//    --- RUTAS DE FAVORITOS ---
// ==========================================

// A. Agregar o quitar un favorito (Botón de Corazón)
app.post('/api/favoritos/toggle', async (req, res) => {
    const { usuario_id, destino_id } = req.body;
    
    // 1. Buscamos si el usuario ya le había dado corazón a este destino
    const { data: existente } = await supabase
        .from('favoritos')
        .select('*')
        .eq('usuario_id', usuario_id)
        .eq('destino_id', destino_id)
        .single();

    if (existente) {
        // 2. Si ya existía, se lo quitamos (Un-favorite)
        await supabase.from('favoritos').delete().eq('id', existente.id);
        return res.status(200).json({ esFavorito: false });
    } else {
        // 3. Si no existía, lo guardamos (Favorite)
        await supabase.from('favoritos').insert([{ usuario_id, destino_id }]);
        return res.status(200).json({ esFavorito: true });
    }
});

// B. Obtener solo los IDs de los favoritos (Para pintar los corazones rojos en el catálogo)
app.get('/api/favoritos/ids/:usuario_id', async (req, res) => {
    const { usuario_id } = req.params;
    const { data, error } = await supabase
        .from('favoritos')
        .select('destino_id')
        .eq('usuario_id', usuario_id);
        
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data.map(f => f.destino_id)); // Retorna un arreglo limpio como [1, 3, 5]
});

// C. Obtener los destinos completos (Para mostrar las tarjetas en la pestaña del Perfil)
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

// ==========================================
//    --- RUTAS PÚBLICAS (PARA CLIENTES) ---
// ==========================================

// 1. LISTAR DESTINOS: Para la página principal y sección de tours
app.get('/api/destinos', async (req, res) => {
    // CAMBIO: Ahora solo trae destinos cuyo campo 'activo' sea verdadero (true)
    const { data, error } = await supabase
        .from('destinos')
        .select('*')
        .eq('activo', true); 
        
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
});

// 2. DETALLE DE DESTINO: Obtener un tour con sus comentarios y autores
app.get('/api/destinos/:id', async (req, res) => {
    const { id } = req.params;
    
    const { data, error } = await supabase
        .from('destinos')
        .select(`
            *,
            comentarios (
                id,
                texto,
                estrellas,
                fecha,
                usuarios ( nombre )
            ),
            imagenes_destino ( url )
        `)
        .eq('id', id)
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
});

// 3. COMENTARIOS: Para que los turistas registrados dejen su opinión
app.post('/api/comentarios', async (req, res) => {
    const { destino_id, usuario_id, texto, estrellas } = req.body;

    const { data, error } = await supabase
        .from('comentarios')
        .insert([{ destino_id, usuario_id, texto, estrellas }]);

    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json({ mensaje: '¡Tu comentario ha sido publicado con éxito!' });
});
