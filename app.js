const express = require('express');
const multer = require('multer');
const fs = require('fs');
const app = express();

const MAX_FILE_SIZE = process.env.DOWNLOAD_APP_WEIGHT * 1024 * 1024;
const DOWNLOAD_ROUT = process.env.DOWNLOAD_APP_ROUT;

const storage = multer.diskStorage({
    destination: (request, file, callback) => {
        callback(null, DOWNLOAD_ROUT);
    },
    filename: (request, file, callback) => {
        callback(null, file.originalname);
    }
});

const fileFilter = (request, file, callback) => {
    if (file.originalname.endsWith('.apk') || file.originalname.endsWith('.ipa')) {
        callback(null, true);
    } else {
        callback(new Error('Error: Tipo de archivo inválido. Solo se admiten archivos .apk/.ipa'), false);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter, limits: { fileSize: MAX_FILE_SIZE } });

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
});

app.post('/uploadApp', upload.single('file'), (req, res) => {
    if (req.file) {
        res.send('Carga de la app completada satisfactoriamente');
    } else {
        res.status(400).send('Error: No se cargo ninguna app');
    } 
});

app.get('/loadedApps', (req, res) => {
    fs.readdir(DOWNLOAD_ROUT, (err, files) => {
        if (err) {
            res.status(500).send('Error: No fue posible leer las apps cargadas');
        } else {
            res.json(files);
        }
    });
});

app.use((err, req, res, next) => {
    if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).send(`Error: El tamaño de la app supera el límite permitido de ${MAX_FILE_SIZE / (1024 * 1024)} MB`);
        } else {
            res.status(500).send(err.message);
        }
    } else {
        next();
    }
});

app.listen(3000, () => console.log('Running server 3000'));