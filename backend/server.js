const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ SEGURO - Solo variables de entorno
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;

// Verificar que las variables existan
if (!JWT_SECRET) {
    console.error('❌ ERROR: JWT_SECRET no está definida en las variables de entorno');
    process.exit(1);
}

if (!MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI no está definida en las variables de entorno');
    process.exit(1);
}

// Middleware
app.use(cors({
    origin: [
        'https://whimsical-phoenix-1e9b16.netlify.app',
        'https://dental-clinic-app-production.up.railway.app',
        'http://localhost:3000'
    ],
    credentials: true
}));
app.use(express.json());

// Conexión a MongoDB Atlas
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('✅ Conectado a MongoDB Atlas');
}).catch(err => {
    console.error('❌ Error conectando a MongoDB:', err);
    process.exit(1);
});

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Esquemas
const pacienteSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    telefono: String,
    email: String,
    direccion: String,
    fecha_nacimiento: Date,
    alergias: [String],
    notas_medicas: String,
    estatus: { type: String, default: 'Activo' },
    fecha_creacion: { type: Date, default: Date.now },
    fecha_actualizacion: { type: Date, default: Date.now }
});

const dentistaSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    especialidad: String,
    telefono: String,
    email: String,
    estado: { type: String, default: 'Activo' },
    comision: { type: Number, default: 0.5 },
    horario_trabajo: {
        lunes: { inicio: String, fin: String },
        martes: { inicio: String, fin: String },
        miercoles: { inicio: String, fin: String },
        jueves: { inicio: String, fin: String },
        viernes: { inicio: String, fin: String },
        sabado: { inicio: String, fin: String }
    },
    fecha_creacion: { type: Date, default: Date.now },
    fecha_actualizacion: { type: Date, default: Date.now }
});

const servicioSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    descripcion: String,
    precio: { type: Number, required: true },
    duracion: { type: Number, default: 60 },
    categoria: String,
    estatus: { type: String, default: 'Activo' },
    fecha_creacion: { type: Date, default: Date.now }
});

const productoSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    descripcion: String,
    marca: String,
    cantidad: { type: Number, required: true },
    precio_compra: { type: Number, required: true },
    precio_venta: { type: Number, required: true },
    codigo_barras: String,
    stock_minimo: { type: Number, default: 5 },
    estatus: { type: String, default: 'Activo' },
    fecha_creacion: { type: Date, default: Date.now },
    fecha_actualizacion: { type: Date, default: Date.now }
});

const citaSchema = new mongoose.Schema({
    paciente_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Paciente', required: true },
    dentista_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Dentista', required: true },
    servicio_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Servicio', required: true },
    descripcion: { type: String, required: true },
    fecha_hora: { type: Date, required: true },
    duracion: { type: Number, required: true },
    estatus: { type: String, default: 'Programada' },
    notas: String,
    fecha_creacion: { type: Date, default: Date.now },
    fecha_actualizacion: { type: Date, default: Date.now }
});

// ESQUEMA ACTUALIZADO CON MÚLTIPLES MONEDAS
const ventaSchema = new mongoose.Schema({
    paciente_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Paciente' },
    cita_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cita' },
    items: [{
        tipo: { type: String, enum: ['servicio', 'producto'], required: true },
        item_id: { type: mongoose.Schema.Types.ObjectId, required: true },
        descripcion: { type: String, required: true },
        cantidad: { type: Number, required: true },
        precio: { type: Number, required: true },
        subtotal: { type: Number, required: true },
        dentista_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Dentista' }
    }],
    subtotal: { type: Number, required: true },
    iva: { type: Number, required: true },
    total: { type: Number, required: true },
    metodo_pago: { type: String, enum: ['efectivo', 'tarjeta', 'transferencia'], required: true },
    monto_pagado: { type: Number, default: 0 },
    cambio: { type: Number, default: 0 },
    // NUEVOS CAMPOS PARA MÚLTIPLES MONEDAS
    moneda: { 
        type: String, 
        enum: ['MXN', 'USD'], 
        default: 'MXN',
        required: true 
    },
    tipo_cambio: { 
        type: Number, 
        default: 1  // 1 USD = X MXN
    },
    estatus: { type: String, enum: ['pendiente', 'pagada', 'cancelada'], default: 'pendiente' },
    fecha_venta: { type: Date, default: Date.now },
    cajero: String,
    fecha_creacion: { type: Date, default: Date.now }
});

const usuarioSchema = new mongoose.Schema({
    usuario: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    nombre: { type: String, required: true },
    rol: { type: String, enum: ['administrador', 'recepcion', 'dentista'], required: true },
    estatus: { type: String, default: 'Activo' },
    fecha_creacion: { type: Date, default: Date.now },
    ultimo_login: Date
});

// Modelos
const Paciente = mongoose.model('Paciente', pacienteSchema);
const Dentista = mongoose.model('Dentista', dentistaSchema);
const Servicio = mongoose.model('Servicio', servicioSchema);
const Producto = mongoose.model('Producto', productoSchema);
const Cita = mongoose.model('Cita', citaSchema);
const Venta = mongoose.model('Venta', ventaSchema);
const Usuario = mongoose.model('Usuario', usuarioSchema);

// ==================== RUTAS DE LA API ====================

// Ruta de verificación
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'API Dental funcionando', timestamp: new Date() });
});

// ==================== PACIENTES ====================
app.get('/api/pacientes', async (req, res) => {
    try {
        const pacientes = await Paciente.find().sort({ fecha_creacion: -1 });
        res.json(pacientes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/pacientes', async (req, res) => {
    try {
        const paciente = new Paciente(req.body);
        await paciente.save();
        res.status(201).json(paciente);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/pacientes/:id', async (req, res) => {
    try {
        const paciente = await Paciente.findByIdAndUpdate(
            req.params.id,
            { ...req.body, fecha_actualizacion: new Date() },
            { new: true }
        );
        res.json(paciente);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/pacientes/:id', async (req, res) => {
    try {
        await Paciente.findByIdAndDelete(req.params.id);
        res.json({ message: 'Paciente eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== DENTISTAS ====================
app.get('/api/dentistas', async (req, res) => {
    try {
        const dentistas = await Dentista.find().sort({ fecha_creacion: -1 });
        res.json(dentistas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/dentistas', async (req, res) => {
    try {
        const dentista = new Dentista(req.body);
        await dentista.save();
        res.status(201).json(dentista);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/dentistas/:id', async (req, res) => {
    try {
        const dentista = await Dentista.findByIdAndUpdate(
            req.params.id,
            { ...req.body, fecha_actualizacion: new Date() },
            { new: true }
        );
        res.json(dentista);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/dentistas/:id', async (req, res) => {
    try {
        await Dentista.findByIdAndDelete(req.params.id);
        res.json({ message: 'Dentista eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== SERVICIOS ====================
app.get('/api/servicios', async (req, res) => {
    try {
        const servicios = await Servicio.find().sort({ fecha_creacion: -1 });
        res.json(servicios);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/servicios', async (req, res) => {
    try {
        const servicio = new Servicio(req.body);
        await servicio.save();
        res.status(201).json(servicio);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/servicios/:id', async (req, res) => {
    try {
        const servicio = await Servicio.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(servicio);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/servicios/:id', async (req, res) => {
    try {
        await Servicio.findByIdAndDelete(req.params.id);
        res.json({ message: 'Servicio eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== PRODUCTOS ====================
app.get('/api/productos', async (req, res) => {
    try {
        const productos = await Producto.find().sort({ fecha_creacion: -1 });
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/productos', async (req, res) => {
    try {
        const producto = new Producto(req.body);
        await producto.save();
        res.status(201).json(producto);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/productos/:id', async (req, res) => {
    try {
        const producto = await Producto.findByIdAndUpdate(
            req.params.id,
            { ...req.body, fecha_actualizacion: new Date() },
            { new: true }
        );
        res.json(producto);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/productos/:id', async (req, res) => {
    try {
        await Producto.findByIdAndDelete(req.params.id);
        res.json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== CITAS ====================
app.get('/api/citas', async (req, res) => {
    try {
        const citas = await Cita.find()
            .populate('paciente_id', 'nombre telefono email')
            .populate('dentista_id', 'nombre especialidad')
            .populate('servicio_id', 'nombre precio duracion')
            .sort({ fecha_hora: 1 });

        res.json(citas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/citas', async (req, res) => {
    try {
        const cita = new Cita(req.body);
        await cita.save();

        const citaPopulada = await Cita.findById(cita._id)
            .populate('paciente_id', 'nombre telefono email')
            .populate('dentista_id', 'nombre especialidad')
            .populate('servicio_id', 'nombre precio duracion');

        res.status(201).json(citaPopulada);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/citas/:id', async (req, res) => {
    try {
        const cita = await Cita.findByIdAndUpdate(
            req.params.id,
            { ...req.body, fecha_actualizacion: new Date() },
            { new: true }
        ).populate('paciente_id', 'nombre')
         .populate('dentista_id', 'nombre')
         .populate('servicio_id', 'nombre precio');

        res.json(cita);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/citas/:id', async (req, res) => {
    try {
        await Cita.findByIdAndDelete(req.params.id);
        res.json({ message: 'Cita eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== VENTAS - ACTUALIZADO CON MÚLTIPLES MONEDAS ====================
app.get('/api/ventas', async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, moneda, metodo_pago } = req.query;
        let query = {};
        
        // Filtro por fechas
        if (fecha_inicio && fecha_fin) {
            query.fecha_venta = {
                $gte: new Date(fecha_inicio),
                $lte: new Date(fecha_fin + 'T23:59:59.999Z')
            };
        }
        
        // Filtro por moneda
        if (moneda) {
            query.moneda = moneda;
        }
        
        // Filtro por método de pago
        if (metodo_pago) {
            query.metodo_pago = metodo_pago;
        }

        const ventas = await Venta.find(query)
            .populate('paciente_id', 'nombre telefono')
            .sort({ fecha_venta: -1 });

        res.json(ventas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/ventas/:id', async (req, res) => {
    try {
        const venta = await Venta.findById(req.params.id)
            .populate('paciente_id', 'nombre')
            .populate('items.dentista_id', 'nombre');

        if (!venta) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        res.json(venta);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/ventas/resumen', async (req, res) => {
    try {
        const { fecha, fecha_inicio, fecha_fin, moneda } = req.query;
        let query = { estatus: 'pagada' };

        if (fecha) {
            query.fecha_venta = {
                $gte: new Date(fecha),
                $lte: new Date(fecha + 'T23:59:59.999Z')
            };
        } else if (fecha_inicio && fecha_fin) {
            query.fecha_venta = {
                $gte: new Date(fecha_inicio),
                $lte: new Date(fecha_fin + 'T23:59:59.999Z')
            };
        }

        // Filtro por moneda
        if (moneda) {
            query.moneda = moneda;
        }

        const ventas = await Venta.find(query);
        const total = ventas.reduce((sum, venta) => sum + venta.total, 0);

        res.json({ total, cantidad: ventas.length, moneda: moneda || 'MXN' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ENDPOINT ACTUALIZADO PARA MÚLTIPLES MONEDAS
app.post('/api/ventas', async (req, res) => {
    try {
        const { moneda = 'MXN', tipo_cambio = 1, ...ventaData } = req.body;
        
        // Si es USD, aplicar tipo de cambio a los precios
        if (moneda === 'USD' && tipo_cambio > 1) {
            ventaData.items = ventaData.items.map(item => ({
                ...item,
                precio: item.precio, // Mantener precio original en USD
                subtotal: item.subtotal // Mantener subtotal original en USD
            }));
            
            // Los totales ya deben venir calculados en la moneda seleccionada
            // El frontend se encarga de la conversión
        }

        const venta = new Venta({
            ...ventaData,
            moneda,
            tipo_cambio
        });

        await venta.save();

        // Actualizar stock de productos
        for (const item of venta.items) {
            if (item.tipo === 'producto') {
                await Producto.findByIdAndUpdate(
                    item.item_id,
                    { $inc: { cantidad: -item.cantidad } }
                );
            }
        }

        const ventaPopulada = await Venta.findById(venta._id)
            .populate('paciente_id', 'nombre');

        res.status(201).json(ventaPopulada);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/ventas/:id/pagar', async (req, res) => {
    try {
        const venta = await Venta.findByIdAndUpdate(
            req.params.id,
            { estatus: 'pagada' },
            { new: true }
        ).populate('paciente_id', 'nombre');

        res.json(venta);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// ==================== MIGRACIÓN TEMPORAL ====================
app.post('/api/migrar-moneda', async (req, res) => {
    try {
        const resultado = await mongoose.connection.collection('ventas').updateMany(
            { moneda: { $exists: false } },
            { $set: { moneda: 'MXN', tipo_cambio: 1 } }
        );
        
        res.json({
            success: true,
            message: `Migración completada. Ventas actualizadas: ${resultado.modifiedCount}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== CORTE DE CAJA ====================
app.get('/api/ventas/corte-caja', async (req, res) => {
    try {
        const { fecha, moneda } = req.query;
        
        if (!fecha) {
            return res.status(400).json({ error: 'La fecha es requerida' });
        }

        const fechaInicio = new Date(fecha);
        const fechaFin = new Date(fecha);
        fechaFin.setDate(fechaFin.getDate() + 1);

        let query = {
            estatus: 'pagada',
            fecha_venta: {
                $gte: fechaInicio,
                $lt: fechaFin
            }
        };

        // Filtro por moneda
        if (moneda) {
            query.moneda = moneda;
        }

        const ventas = await Venta.find(query)
            .populate('paciente_id', 'nombre')
            .sort({ fecha_venta: 1 });

        const resultado = {
            efectivo: 0,
            tarjeta: 0,
            transferencia: 0,
            total: 0,
            cantidad_ventas: ventas.length,
            moneda: moneda || 'MXN',
            detalle: ventas.map(venta => ({
                fecha_venta: venta.fecha_venta,
                paciente: venta.paciente_id ? venta.paciente_id.nombre : 'No especificado',
                metodo_pago: venta.metodo_pago,
                moneda: venta.moneda,
                tipo_cambio: venta.tipo_cambio,
                total: venta.total,
                descripcion: `Venta ${venta._id} - ${venta.items.length} items`
            }))
        };

        ventas.forEach(venta => {
            resultado[venta.metodo_pago.toLowerCase()] += venta.total;
            resultado.total += venta.total;
        });

        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== NÓMINA ====================
app.get('/api/nomina/calcular', async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        
        const ventas = await Venta.find({
            estatus: 'pagada',
            fecha_venta: {
                $gte: new Date(fecha_inicio),
                $lte: new Date(fecha_fin + 'T23:59:59.999Z')
            }
        }).populate('paciente_id', 'nombre');

        const dentistas = await Dentista.find({ estado: 'Activo' });
        const resultado = [];

        for (const dentista of dentistas) {
            const ventasDentista = ventas.filter(venta => 
                venta.items.some(item => 
                    item.tipo === 'servicio' && item.dentista_id && item.dentista_id.toString() === dentista._id.toString()
                )
            );

            const totalVentas = ventasDentista.reduce((sum, venta) => {
                const serviciosDentista = venta.items.filter(item => 
                    item.tipo === 'servicio' && item.dentista_id && item.dentista_id.toString() === dentista._id.toString()
                );
                return sum + serviciosDentista.reduce((itemSum, item) => itemSum + item.subtotal, 0);
            }, 0);

            const comisionGanada = totalVentas * (dentista.comision / 100);

            resultado.push({
                _id: dentista._id,
                nombre: dentista.nombre,
                comision: dentista.comision * 100, // Convertir a porcentaje
                total_ventas: totalVentas,
                comision_ganada: comisionGanada,
                cantidad_ventas: ventasDentista.length,
                estado: dentista.estado,
                estatus_pago: 'Pendiente'
            });
        }

        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/nomina/pagar/:dentistaId', async (req, res) => {
    try {
        res.json({ 
            message: 'Comisión marcada como pagada',
            dentistaId: req.params.dentistaId,
            fecha_pago: new Date()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== AUTENTICACIÓN ====================
app.post('/api/login', async (req, res) => {
    try {
        const { usuario, password } = req.body;
        
        const user = await Usuario.findOne({ usuario });
        if (!user) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        user.ultimo_login = new Date();
        await user.save();

        const token = jwt.sign(
            { userId: user._id, usuario: user.usuario, rol: user.rol },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            usuario: {
                id: user._id,
                usuario: user.usuario,
                nombre: user.nombre,
                rol: user.rol
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear usuario (SOLO para administradores)
app.post('/api/usuarios', authenticateToken, async (req, res) => {
    try {
        // Solo administradores pueden crear usuarios
        if (req.user.rol !== 'administrador') {
            return res.status(403).json({ error: 'Solo administradores pueden crear usuarios' });
        }

        const { usuario, password, nombre, rol } = req.body;

        // Validaciones
        if (!usuario || !password || !nombre || !rol) {
            return res.status(400).json({ error: 'Faltan campos: usuario, password, nombre, rol' });
        }

        if (!['administrador', 'recepcion', 'dentista'].includes(rol)) {
            return res.status(400).json({ error: 'Rol inválido' });
        }

        // Verificar si ya existe
        const existe = await Usuario.findOne({ usuario });
        if (existe) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }

        // Hashear contraseña
        const hashPassword = await bcrypt.hash(password, 10);

        // Crear usuario
        const nuevoUsuario = new Usuario({
            usuario,
            password: hashPassword,
            nombre,
            rol
        });

        await nuevoUsuario.save();

        res.status(201).json({
            message: 'Usuario creado exitosamente',
            usuario: {
                id: nuevoUsuario._id,
                usuario: nuevoUsuario.usuario,
                nombre: nuevoUsuario.nombre,
                rol: nuevoUsuario.rol
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Listar usuarios (SOLO administradores)
app.get('/api/usuarios', authenticateToken, async (req, res) => {
    try {
        if (req.user.rol !== 'administrador') {
            return res.status(403).json({ error: 'Solo administradores pueden ver usuarios' });
        }
        
        const usuarios = await Usuario.find({}, { password: 0 }).sort({ fecha_creacion: -1 });
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Middleware para logging de requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo salió mal en el servidor!' });
});

// Ruta 404 para API
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Endpoint de API no encontrado' });
});

// Ruta para cualquier otra ruta
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Ruta no encontrada',
        message: 'Esta ruta no existe en el servidor. Las rutas API empiezan con /api/'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📊 API disponible en http://localhost:${PORT}/api`);
    console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
    console.log(`👥 Pacientes: http://localhost:${PORT}/api/pacientes`);
    console.log(`👨‍⚕️ Dentistas: http://localhost:${PORT}/api/dentistas`);
    console.log(`🛎️ Servicios: http://localhost:${PORT}/api/servicios`);
});

// Manejar cierre graceful
process.on('SIGINT', async () => {
    console.log('\n🔌 Cerrando servidor...');
    await mongoose.connection.close();
    console.log('✅ Conexión a MongoDB cerrada');
    process.exit(0);
});