const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const moment = require('moment-timezone');
const { log } = require('console');
const app = express();

let coordinates = [];

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

function getMexicoTime() {
  return moment.tz("America/Mexico_City").format('DD-MM-YYYY HH:mm:ss');
}

function logWithTimestamp(message) {
  const timestamp = getMexicoTime();
  const logMessage = `[${ timestamp }] ${ message }\n`;
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
  logWithTimestamp('Petición POST: ' + JSON.stringify(req.body));
  const { latitude, longitude } = req.body;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).send({ message: 'Invalid coordinates format' });
  }
  // Obtener hora actual en México
  const timestamp = getMexicoTime();
  coordinates.push({ latitude, longitude, timestamp });
  logWithTimestamp('Coordenadas recibidas: ' + JSON.stringify({ latitude, longitude, timestamp }));
  guardarCoordenadas();
  res.status(200).send({ message: 'Coordinates saved' });
});

app.get('/api/coordinates', (req, res) => {
  if (coordinates.length === 0) {
    logWithTimestamp('No hay coordenadas disponibles');
    return res.status(404).send({ message: 'Coordinates not found' });
  }
  //logWithTimestamp('Coordenadas enviadas: ' + JSON.stringify(coordinates));
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

function convertToDecimal(degreeMin, direction) {
  const degrees = parseFloat(degreeMin.slice(0, -2));
  const minutes = parseFloat(degreeMin.slice(-2));
  let decimal = degrees + (minutes / 60);
  if (direction === 'S' || direction === 'W') {
    decimal *= -1;
  }
  return decimal;
}

app.get('/api/coordinates_string', (req, res) => {
  const query = req.query;
  const rawCoords = Object.keys(query)[0];
  const parts = rawCoords.split(',');
  if (parts.length < 4) {
    logWithTimestamp('Formato de coordenadas inválido');
    return res.status(400).send({ message: 'Invalid coordinates format' });
  }

  // Ajuste de partes para convertir correctamente
  const latitude = convertToDecimal(parts[0], parts[1]) / 10;
  const longitude = convertToDecimal(parts[2], parts[3]) / 10;

  if (isNaN(latitude) || isNaN(longitude)) {
    logWithTimestamp('Formato de coordenadas inválido');
    return res.status(400).send({ message: 'Invalid coordinates format' });
  }

  // Obtener hora actual en México
  const timestamp = getMexicoTime();
  coordinates.push({ latitude, longitude, timestamp });
  logWithTimestamp('Coordenadas recibidas: ' + JSON.stringify({ latitude, longitude, timestamp }));
  guardarCoordenadas();
  res.status(200).send({ message: 'Coordinates saved' });
});

function convertToDecimal(degreeMin, direction) {
  const degree = parseInt(degreeMin.slice(0, -7));
  const minutes = parseFloat(degreeMin.slice(-7));
  let decimal = degree + (minutes / 60);
  if (direction === 'S' || direction === 'W') {
    decimal *= -1;
  }
  return decimal;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logWithTimestamp(`Server is running on port ${ PORT }`);
});
