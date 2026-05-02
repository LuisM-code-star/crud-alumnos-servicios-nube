const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

let db;

(async () => {
    db = await open({
        filename: './database.db',
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS alumnos (
            clave TEXT PRIMARY KEY,
            nombre TEXT,
            grupo TEXT,
            anio INTEGER,
            tutor TEXT,
            materias TEXT
        )
    `);

    // Lógica para insertar datos iniciales si la tabla está vacía
    const count = await db.get('SELECT COUNT(*) as total FROM alumnos');
    if (count.total === 0) {
        const alumnosIniciales = [
            ['510822', 'Natalia Romero González', '1A', 1, 'Juan Carlos Becerra Mendez', 'Español 1, Matemáticas 1, Inglés 1'],
            ['533577', 'Jacqueline López Pérez', '1A', 1, 'Gabriela Mendoza Jiménez', 'Español 1, Matemáticas 1, Inglés 1'],
            ['549812', 'Luis Enrique Díaz Torres', '2B', 2, 'Nadia Delgado Topete', 'Redacción 2, Física, Química'],
            ['634581', 'Tania Franco Pilares', '2C', 2, 'Sandra Álvarez Gutiérrez', 'Redacción 2, Física, Química'],
            ['679003', 'Óscar Pinzón Cárdenas', '3E', 3, 'Fernando Novoa Lomelí', 'Filosofía, Cálculo, Química Orgánica']
        ];
        for (let a of alumnosIniciales) {
            await db.run('INSERT INTO alumnos VALUES (?,?,?,?,?,?)', a);
        }
    }
})();

// Rutas
app.get('/', async (req, res) => {
    const { busca, filtro } = req.query;
    let alumnos;
    if (busca && filtro) {
        alumnos = await db.all(`SELECT * FROM alumnos WHERE ${filtro} LIKE ?`, [`%${busca}%`]);
    } else {
        alumnos = await db.all('SELECT * FROM alumnos');
    }
    res.render('index', { alumnos });
});

app.get('/nuevo', (req, res) => res.render('form', { alumno: null }));

app.post('/guardar', async (req, res) => {
    const { clave, nombre, grupo, anio, tutor, materias } = req.body;
    await db.run('INSERT OR REPLACE INTO alumnos VALUES (?,?,?,?,?,?)', [clave, nombre, grupo, anio, tutor, materias]);
    res.redirect('/');
});

app.get('/editar/:clave', async (req, res) => {
    const alumno = await db.get('SELECT * FROM alumnos WHERE clave = ?', [req.params.clave]);
    res.render('form', { alumno });
});

app.get('/eliminar/:clave', async (req, res) => {
    await db.run('DELETE FROM alumnos WHERE clave = ?', [req.params.clave]);
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));