const bcrypt = require('bcrypt');

const password = 'admin123'; // Cambia esto por la contraseña deseada
bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
        console.error('Error generando hash:', err);
        return;
    }
    console.log('Hash de la contraseña:', hash);
});