const axios = require('axios');
const https = require('https');
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
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'interest-cohort=()'); // Asegúrate de que esté bien configurado según tu necesidad y las especificaciones actuales.
  next();
});

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

// Configuración para usar el proxy de Fixie con Axios
const fixieUrl = process.env.FIXIE_URL;
if (!fixieUrl) {
  console.error('La variable de entorno FIXIE_URL no está configurada.');
  process.exit(1); // Salir del proceso con un código de error
}

// Extraer host, puerto y credenciales del FIXIE_URL
const fixieParts = fixieUrl.match(/^https?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)/);
if (!fixieParts) {
  console.error('Formato de FIXIE_URL no válido.');
  process.exit(1); // Salir del proceso con un código de error
}

// Configurar una instancia de Axios con agentes HTTPS personalizados
const agent = new https.Agent({
  rejectUnauthorized: false, // Solo para pruebas, configúralo correctamente para producción
  secureProtocol: 'TLSv1_2_method', // Usa 'TLSv1_2_method' en lugar de 'TLS_method'
  minVersion: 'TLSv1.2', // Establece la versión mínima que tu servidor destino soporte
});



const axiosInstance = axios.create({
  httpsAgent: agent,
  proxy: {
    host: fixieParts[3],
    port: parseInt(fixieParts[4]),
    auth: {
      username: fixieParts[1],
      password: fixieParts[2]
    }
  }
});

app.post('/api/coordinates', (req, res) => {
  logWithTimestamp('Petición POST req.body: ' + JSON.stringify(req.body));
  const { latitude, longitude } = req.body;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).send({ message: 'Invalid coordinates format' });
  }

  axiosInstance.post('https://proyecto-electronica-34053442d1e0.herokuapp.com/api/coordinates', { latitude, longitude })
  .then(response => {
    logWithTimestamp('Respuesta del servidor: ' + JSON.stringify(response.data));
    coordinates.push({ latitude, longitude });
    logWithTimestamp('Coordenadas recibidas: ' + JSON.stringify({ latitude, longitude }));
    guardarCoordenadas();
    res.status(200).send({ message: 'Coordinates saved' });
  })
  .catch(error => {
    if (error.response) {
      // La solicitud fue hecha y el servidor respondió con un código de estado que no está en el rango de 2xx
      logWithTimestamp('Error en la solicitud POST: ' + error.response.status + ' ' + error.response.statusText);
      res.status(500).send({ message: 'Error saving coordinates' });
    } else if (error.request) {
      // La solicitud fue hecha pero no se recibió respuesta
      logWithTimestamp('No se recibió respuesta del servidor');
      res.status(500).send({ message: 'No response from server' });
    } else {
      // Error configurando la solicitud
      logWithTimestamp('Error configurando la solicitud: ' + error.message);
      res.status(500).send({ message: 'Error setting up request' });
    }
    logWithTimestamp('Error completo: ' + error);
  });

});

app.get('/api/coordinates', (req, res) => {
  if (coordinates.length === 0) {
    logWithTimestamp('No hay coordenadas disponibles');
    return res.status(404).send({ message: 'Coordinates not found' });
  }
  res.status(200).send(coordinates);
});

app.delete('/api/coordinates', (req, res) => {
  coordinates = [];
  logWithTimestamp('Coordenadas borradas');
  guardarCoordenadas();
  res.status(200).send({ message: 'Coordinates deleted' });
  logWithTimestamp('--------- Todas las coordenadas han sido borradas ---------');
});

app.get('/log', (req, res) => {
  fs.readFile('log.txt', 'utf8', (err, data) => {
    if (err) {
      logWithTimestamp('Error leyendo el archivo de log: ' + err);
      return res.status(500).send({ message: 'Error reading log file' });
    }
    const formattedData = data.replace(/\n/g, '<br>');
    res.status(200).send(formattedData);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logWithTimestamp(`Server is running on port ${PORT}`);
});
