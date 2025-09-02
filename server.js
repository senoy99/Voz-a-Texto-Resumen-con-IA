require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // sirve index.html y archivos estáticos

app.post('/resumen', async (req, res) => {
  const { text, level, style } = req.body;
  const hfApiKey = process.env.HF_API_KEY;

  if (!hfApiKey) {
    return res.status(500).json({ summary: '❌ Clave API de Hugging Face no configurada.' });
  }

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ summary: '⚠️ Texto faltante o vacío.' });
  }

  // 🧠 Construir prompt según estilo
  const nivelTexto = level || '50'; // por defecto medio
  let prompt = '';

  switch (style) {
    case 'reformulado':
      prompt = `Reformula y resume este texto en español con nivel ${nivelTexto}, evitando palabras en inglés: ${text}`;
      break;
    case 'simplificado':
      prompt = `Resume este texto en español con nivel ${nivelTexto} usando lenguaje sencillo y claro: ${text}`;
      break;
    default:
      prompt = `Resume este texto en español con nivel ${nivelTexto}: ${text}`;
  }

  try {
    const response = await fetch('https://api-inference.huggingface.co/models/facebook/bart-large-cnn', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: prompt })
    });

    const data = await response.json();

    if (data.error) {
      console.error('❌ Error de Hugging Face:', data.error);
      return res.status(500).json({ summary: `❌ ${data.error}` });
    }

    const summary = data[0]?.summary_text || 'Resumen no disponible.';
    res.json({ summary });
  } catch (error) {
    console.error('❌ Error al generar resumen con Hugging Face:', error);
    res.status(500).json({ summary: '❌ Error inesperado al generar resumen.' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
