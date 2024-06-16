const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const moment = require('moment-timezone');
const app = express();

let coordinates = [];

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

function getMexicoTime() {
  return moment.tz("America/Mexico_City").format('YYYY-MM-DD HH:mm:ss');
}

function logWithTimestamp(message) {
  const timestamp = getMexicoTime();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage);

  fs.appendFile('log.txt', logMessage, (err) => {
    if (err) {
      console.error('Error guardando el log en el archivo:', err);
    }
  });
}

function guardarCoordenadas() {
  fs.writeFile('coordenadas.json', JSON.stringify(coordinates), err => {
    if (err) {
      logWithTimestamp('Error guardando coordenadas: ' + err);
    } else {
      logWithTimestamp('Coordenadas guardadas en el archivo.');
    }
  });
}

fs.readFile('coordenadas.json', (err, data) => {
  if (err) {
    logWithTimestamp('Error leyendo el archivo de coordenadas: ' + err);
    return;
  }
  coordinates = JSON.parse(data);
  logWithTimestamp('Coordenadas cargadas desde el archivo: ' + JSON.stringify(coordinates));
});

app.post('/api/coordinates', (req, res) => {
  const { latitude, longitude } = req.body;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).send({ message: 'Invalid coordinates format' });
  }

  coordinates.push({ latitude, longitude });
  logWithTimestamp('Coordenadas recibidas: ' + JSON.stringify({ latitude, longitude }));
  guardarCoordenadas();
  res.status(200).send({ message: 'Coordinates saved' });
});

app.get('/api/coordinates', (req, res) => {
  if (coordinates.length === 0) {
    logWithTimestamp('No hay coordenadas disponibles');
    return res.status(404).send({ message: 'Coordinates not found' });
  }
  logWithTimestamp('Coordenadas enviadas: ' + JSON.stringify(coordinates));
  res.status(200).send(coordinates);
});

app.delete('/api/coordinates', (req, res) => {
  coordinates = [];
  logWithTimestamp('Coordenadas borradas');
  guardarCoordenadas();
  res.status(200).send({ message: 'Coordinates deleted' });
  // Escribir en log.txt
  logWithTimestamp('--------- Todas las coordenadas han sido borradas ---------');
});

app.get('/log', (req, res) => {
  fs.readFile('log.txt', 'utf8', (err, data) => {
    if (err) {
      logWithTimestamp('Error leyendo el archivo de log: ' + err);
      return res.status(500).send({ message: 'Error reading log file' });
    }
    // Reemplazar saltos de línea por <br> tags
    const formattedData = data.replace(/\n/g, '<br>');
    res.status(200).send(formattedData);
  });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logWithTimestamp(`Server is running on port ${PORT}`);
});