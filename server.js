const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs'); // Módulo para leer y escribir archivos del sistema de archivos
const app = express();

let coordinates = []; // Aquí se almacenarán las coordenadas GPS

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Función para guardar las coordenadas en el archivo JSON
function guardarCoordenadas() {
  fs.writeFile('coordenadas.json', JSON.stringify(coordinates), err => {
    if (err) {
      console.error('Error guardando coordenadas:', err);
    } else {
      console.log('Coordenadas guardadas en el archivo.');
    }
  });
}

// Cargar coordenadas desde el archivo JSON al iniciar la aplicación
fs.readFile('coordenadas.json', (err, data) => {
  if (err) {
    console.error('Error leyendo el archivo de coordenadas:', err);
    return;
  }
  coordinates = JSON.parse(data);
  console.log('Coordenadas cargadas desde el archivo:', coordinates);
});

// Ruta para recibir y guardar las coordenadas
// Ejemplo de solicitud POST: { "latitude": 19.4326, "longitude": -99.1332 }
// Ejemplo de otra solicitud POST con 
app.post('/api/coordinates', (req, res) => {
  const { latitude, longitude } = req.body;
  if (latitude && longitude) {
    coordinates.push({ latitude, longitude });
    console.log("Guardadas: " + coordinates);
    guardarCoordenadas(); // Guardar coordenadas en el archivo después de agregarlas
    res.status(200).send({ message: 'Coordinates saved' });
  } else {
    res.status(400).send({ message: 'Invalid coordinates' });
  }
});

// Se pasa esta cadena al post: {\"lat\": \"" + lat + "\", \"lon\": \"" + lon + "\"}"; extraer y guardar en coordenadas.json
app.post('/api/coordinates2', (req, res) => {
  const { lat, lon } = req.body;
  console.log("Recibidas: " + lat + ", " + lon);
  if (lat && lon) {
    coordinates.push({ latitude: lat, longitude: lon });
    console.log("Guardadas: " + coordinates);
    guardarCoordenadas(); // Guardar coordenadas en el archivo después de agregarlas
    res.status(200).send({ message: 'Coordinates saved' });
  } else {
    res.status(400).send({ message: 'Invalid coordinates' });
  }
});


// Ruta para obtener las coordenadas guardadas
app.get('/api/coordinates', (req, res) => {
  if (coordinates.length === 0) {
    console.log("No hay coordenadas");
    return res.status(404).send({ message: 'Coordinates not found' });
  }
  console.log("Enviadas: " + coordinates);
  res.status(200).send(coordinates);
});

// Ruta para borrar las coordenadas guardadas
app.delete('/api/coordinates', (req, res) => {
  coordinates = []; // Limpiar el arreglo de coordenadas
  console.log("Coordenadas borradas");
  guardarCoordenadas(); // Guardar las coordenadas vacías en el archivo
  res.status(200).send({ message: 'Coordinates deleted' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
