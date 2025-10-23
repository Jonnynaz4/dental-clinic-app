const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Tu conexión de MongoDB Atlas con la contraseña real
const MONGODB_URI = 'mongodb+srv://admindental:4dmin2025*@dentaltest.8qjwcvj.mongodb.net/dental_clinic?retryWrites=true&w=majority&appName=Dentaltest';

// Conectar a MongoDB Atlas
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

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
    duracion: { type: Number, default: 60 }, // minutos
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
        dentista_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Dentista' } // Solo para servicios
    }],
    subtotal: { type: Number, required: true },
    iva: { type: Number, required: true },
    total: { type: Number, required: true },
    metodo_pago: { type: String, enum: ['efectivo', 'tarjeta', 'transferencia'], required: true },
    monto_pagado: { type: Number, default: 0 },
    cambio: { type: Number, default: 0 },
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

// Datos de ejemplo
async function initializeDatabase() {
    try {
        console.log('🔗 Conectando a MongoDB Atlas...');
        console.log('📦 URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Oculta credenciales en log

        // Esperar a que se establezca la conexión
        await mongoose.connection.asPromise();
        console.log('✅ Conectado a MongoDB Atlas exitosamente!');

        console.log('🗃️ Inicializando base de datos...');

        // Limpiar colecciones existentes
        console.log('🧹 Limpiando colecciones existentes...');
        await Paciente.deleteMany({});
        await Dentista.deleteMany({});
        await Servicio.deleteMany({});
        await Producto.deleteMany({});
        await Cita.deleteMany({});
        await Venta.deleteMany({});
        await Usuario.deleteMany({});

        // Crear pacientes de ejemplo
        console.log('👥 Creando pacientes...');
        const pacientes = await Paciente.insertMany([
            {
                nombre: 'Juan Pérez',
                telefono: '1234567890',
                email: 'juan@example.com',
                direccion: 'Calle Principal 123',
                fecha_nacimiento: new Date('1985-05-15')
            },
            {
                nombre: 'María García',
                telefono: '0987654321',
                email: 'maria@example.com',
                direccion: 'Avenida Central 456',
                fecha_nacimiento: new Date('1990-08-22')
            },
            {
                nombre: 'Carlos López',
                telefono: '5551234567',
                email: 'carlos@example.com',
                direccion: 'Plaza Mayor 789',
                fecha_nacimiento: new Date('1978-12-10')
            },
            {
                nombre: 'Ana Martínez',
                telefono: '5559876543',
                email: 'ana@example.com',
                direccion: 'Boulevard Norte 321',
                fecha_nacimiento: new Date('1992-03-30')
            }
        ]);

        // Crear dentistas de ejemplo
        console.log('👨‍⚕️ Creando dentistas...');
        const dentistas = await Dentista.insertMany([
            {
                nombre: 'Dr. Roberto Martínez',
                especialidad: 'Ortodoncia',
                telefono: '5551112233',
                email: 'dr.martinez@clinica.com',
                comision: 0.5,
                horario_trabajo: {
                    lunes: { inicio: '09:00', fin: '18:00' },
                    martes: { inicio: '09:00', fin: '18:00' },
                    miercoles: { inicio: '09:00', fin: '18:00' },
                    jueves: { inicio: '09:00', fin: '18:00' },
                    viernes: { inicio: '09:00', fin: '17:00' }
                }
            },
            {
                nombre: 'Dra. Ana Rodríguez',
                especialidad: 'Periodoncia',
                telefono: '5554445566',
                email: 'dra.rodriguez@clinica.com',
                comision: 0.45,
                horario_trabajo: {
                    lunes: { inicio: '10:00', fin: '19:00' },
                    martes: { inicio: '10:00', fin: '19:00' },
                    miercoles: { inicio: '10:00', fin: '19:00' },
                    jueves: { inicio: '10:00', fin: '19:00' },
                    viernes: { inicio: '10:00', fin: '16:00' }
                }
            },
            {
                nombre: 'Dr. Miguel Sánchez',
                especialidad: 'Cirugía Dental',
                telefono: '5557778899',
                email: 'dr.sanchez@clinica.com',
                comision: 0.55,
                horario_trabajo: {
                    lunes: { inicio: '08:00', fin: '16:00' },
                    martes: { inicio: '08:00', fin: '16:00' },
                    miercoles: { inicio: '08:00', fin: '16:00' },
                    jueves: { inicio: '08:00', fin: '16:00' }
                }
            }
        ]);

        // Crear servicios de ejemplo
        console.log('🛎️ Creando servicios...');
        const servicios = await Servicio.insertMany([
            {
                nombre: 'Limpieza Dental',
                descripcion: 'Limpieza dental profesional completa',
                precio: 500.00,
                duracion: 60,
                categoria: 'Preventivo'
            },
            {
                nombre: 'Extracción Simple',
                descripcion: 'Extracción de pieza dental',
                precio: 800.00,
                duracion: 30,
                categoria: 'Cirugía'
            },
            {
                nombre: 'Resina Dental',
                descripcion: 'Restauración con resina compuesta',
                precio: 650.00,
                duracion: 45,
                categoria: 'Restaurativo'
            },
            {
                nombre: 'Blanqueamiento Dental',
                descripcion: 'Tratamiento de blanqueamiento profesional',
                precio: 1200.00,
                duracion: 90,
                categoria: 'Estético'
            },
            {
                nombre: 'Consulta de Diagnóstico',
                descripcion: 'Consulta inicial y diagnóstico',
                precio: 300.00,
                duracion: 30,
                categoria: 'Consulta'
            },
            {
                nombre: 'Ortodoncia - Ajuste',
                descripcion: 'Ajuste de brackets y arcos',
                precio: 400.00,
                duracion: 45,
                categoria: 'Ortodoncia'
            }
        ]);

        // Crear productos de ejemplo
        console.log('🛍️ Creando productos...');
        const productos = await Producto.insertMany([
            {
                nombre: 'Cepillo Dental Eléctrico',
                descripcion: 'Cepillo dental eléctrico recargable',
                marca: 'Oral-B',
                cantidad: 25,
                precio_compra: 150.00,
                precio_venta: 300.00,
                codigo_barras: '7501234567890',
                stock_minimo: 5
            },
            {
                nombre: 'Pasta Dental Blanqueadora',
                descripcion: 'Pasta dental con efecto blanqueador',
                marca: 'Colgate',
                cantidad: 50,
                precio_compra: 25.00,
                precio_venta: 60.00,
                codigo_barras: '7501234567891',
                stock_minimo: 10
            },
            {
                nombre: 'Hilo Dental',
                descripcion: 'Hilo dental con fluor',
                marca: 'Reach',
                cantidad: 30,
                precio_compra: 15.00,
                precio_venta: 35.00,
                codigo_barras: '7501234567892',
                stock_minimo: 8
            },
            {
                nombre: 'Enjuague Bucal',
                descripcion: 'Enjuague bucal anticaries',
                marca: 'Listerine',
                cantidad: 20,
                precio_compra: 40.00,
                precio_venta: 85.00,
                codigo_barras: '7501234567893',
                stock_minimo: 5
            },
            {
                nombre: 'Cepillo Dental Manual',
                descripcion: 'Cepillo dental de cerdas suaves',
                marca: 'Sensodyne',
                cantidad: 40,
                precio_compra: 12.00,
                precio_venta: 25.00,
                codigo_barras: '7501234567894',
                stock_minimo: 15
            },
            {
                nombre: 'Protector Solar Labial',
                descripcion: 'Protector solar para labios',
                marca: 'Blistex',
                cantidad: 15,
                precio_compra: 18.00,
                precio_venta: 40.00,
                codigo_barras: '7501234567895',
                stock_minimo: 5
            }
        ]);

        // Crear usuario administrador
        console.log('👤 Creando usuario administrador...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        await Usuario.create({
            usuario: 'admin',
            password: hashedPassword,
            nombre: 'Administrador del Sistema',
            rol: 'administrador'
        });

        // Crear algunos usuarios adicionales
        await Usuario.create({
            usuario: 'recepcion',
            password: await bcrypt.hash('recepcion123', 10),
            nombre: 'Recepcionista Principal',
            rol: 'recepcion'
        });

        await Usuario.create({
            usuario: 'dentista1',
            password: await bcrypt.hash('dentista123', 10),
            nombre: 'Dr. Roberto Martínez',
            rol: 'dentista'
        });

        console.log('\n🎉 Base de datos inicializada exitosamente!');
        console.log('==========================================');
        console.log('📊 Datos creados:');
        console.log(`   👥 ${pacientes.length} pacientes`);
        console.log(`   👨‍⚕️ ${dentistas.length} dentistas`);
        console.log(`   🛎️ ${servicios.length} servicios`);
        console.log(`   🛍️ ${productos.length} productos`);
        console.log(`   👤 3 usuarios del sistema`);
        console.log('');
        console.log('🔑 Credenciales de acceso:');
        console.log('   Administrador:');
        console.log('     Usuario: admin');
        console.log('     Contraseña: admin123');
        console.log('');
        console.log('   Recepcionista:');
        console.log('     Usuario: recepcion');
        console.log('     Contraseña: recepcion123');
        console.log('');
        console.log('   Dentista:');
        console.log('     Usuario: dentista1');
        console.log('     Contraseña: dentista123');
        console.log('');
        console.log('🌐 La base de datos está lista en MongoDB Atlas!');

    } catch (error) {
        console.error('❌ Error inicializando la base de datos:', error);
        console.error('Detalles:', error.message);
        
        // Mostrar más detalles del error
        if (error.name === 'MongoServerError') {
            console.error('🔧 Código de error MongoDB:', error.code);
        }
        if (error.name === 'MongooseServerSelectionError') {
            console.error('🌐 Error de conexión - Verifica:');
            console.error('   - Tu conexión a internet');
            console.error('   - La whitelist de IPs en MongoDB Atlas');
            console.error('   - Que la base de datos "dental_clinic" exista');
        }
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexión cerrada.');
        process.exit(0);
    }
}

// Manejar eventos de conexión
mongoose.connection.on('connected', () => {
    console.log('✅ Mongoose conectado a MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Error de conexión Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose desconectado de MongoDB');
});

// Manejar cierre graceful
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada por interrupción del usuario');
    process.exit(0);
});

// Ejecutar inicialización
initializeDatabase();