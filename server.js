// server.js - Servidor Bridge para Railway
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;

// ============================================
// ⚙️ CONFIGURACIÓN - Variables de entorno
// ============================================
const BASE44_APP_URL = process.env.BASE44_APP_URL;  // Tu app en Base44
const BASE44_API_KEY = process.env.BASE44_API_KEY;  // Tu API Key

// Middlewares
app.use(cors());
app.use(express.json());

// ============================================
// 📡 ENDPOINT: Recibir datos del ESP32
// ============================================
app.post('/api/reading', async (req, res) => {
  try {
    console.log('📥 Datos recibidos del ESP32:', req.body);

    const data = req.body;

    // Validar datos requeridos
    if (!data.device_id || !data.device_secret) {
      return res.status(400).json({
        success: false,
        error: 'Faltan device_id o device_secret'
      });
    }

    // 1. Buscar dispositivo en Base44
    const devicesResponse = await axios.get(
      `${BASE44_APP_URL}/api/entities/Device`,
      {
        params: {
          filter: JSON.stringify({ device_id: data.device_id })
        },
        headers: {
          'Authorization': `Bearer ${BASE44_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const devices = devicesResponse.data;

    if (!devices || devices.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Dispositivo no encontrado'
      });
    }

    const device = devices[0];

    // 2. Validar device_secret
    if (device.device_secret !== data.device_secret) {
      return res.status(401).json({
        success: false,
        error: 'Clave secreta incorrecta'
      });
    }

    // 3. Crear lectura en Base44
    const readingData = {
      device_id: device.id,
      timestamp: data.timestamp || new Date().toISOString(),
      temperature_c: data.temperature_c,
      humidity_pct: data.humidity_pct,
      pressure_hpa: data.pressure_hpa,
      co_ppm: data.co_ppm,
      pm2_5: data.pm2_5,
      smoke_detected: data.smoke_detected || false,
      battery_pct: data.battery_pct,
      gps_lat: data.gps_lat,
      gps_lon: data.gps_lon
    };

    const readingResponse = await axios.post(
      `${BASE44_APP_URL}/api/entities/Reading`,
      readingData,
      {
        headers: {
          'Authorization': `Bearer ${BASE44_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const reading = readingResponse.data;

    // 4. Actualizar última lectura del dispositivo
    await axios.patch(
      `${BASE44_APP_URL}/api/entities/Device/${device.id}`,
      { last_reading_at: readingData.timestamp },
      {
        headers: {
          'Authorization': `Bearer ${BASE44_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Lectura guardada:', reading.id);

    res.json({
      success: true,
      message: 'Lectura guardada correctamente',
      reading_id: reading.id
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 🏥 HEALTH CHECK
// ============================================
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Ilex Techne Bridge',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// ============================================
// 🚀 INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📡 Base44 URL: ${BASE44_APP_URL}`);
});


