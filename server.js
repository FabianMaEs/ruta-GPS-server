const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

const coordinates = []; // Aquí se almacenarán las coordenadas GPS

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Ruta para verificar que el servidor está funcionando
app.get('/', (req, res) => {
  res.status(200).send({ message: 'Server is running' });
});

// Ruta para recibir y guardar las coordenadas
app.post('/api/coordinates', (req, res) => {
  const { latitude, longitude } = req.body;
  if (latitude && longitude) {
    coordinates.push({ latitude, longitude });
    console.log("Guardadas: " + coordinates);
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
  coordinates.length = 0;
  console.log("Coordenadas borradas");
  res.status(200).send({ message: 'Coordinates deleted' });
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
