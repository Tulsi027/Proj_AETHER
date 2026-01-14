require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { DebateCoordinator } = require('./coordinator');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Store active analyses (in production, use Redis)
const activeAnalyses = new Map();

// Extract text from uploaded file
async function extractText(file) {
  const buffer = file.buffer;
  
  if (file.mimetype === 'application/pdf') {
    const data = await pdfParse(buffer);
    return data.text;
  } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else if (file.mimetype === 'text/plain') {
    return buffer.toString('utf-8');
  } else {
    throw new Error('Unsupported file type');
  }
}

// SSE endpoint for real-time updates
app.get('/api/analysis/:id/stream', (req, res) => {
  const analysisId = req.params.id;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const analysis = activeAnalyses.get(analysisId);
  if (!analysis) {
    res.write(`data: ${JSON.stringify({ error: 'Analysis not found' })}\n\n`);
    res.end();
    return;
  }

  analysis.listeners.push((data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  });

  req.on('close', () => {
    const idx = analysis.listeners.indexOf(res);
    if (idx > -1) analysis.listeners.splice(idx, 1);
  });
});

// Start analysis
app.post('/api/analyze', upload.single('report'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const reportText = await extractText(req.file);
    const analysisId = Date.now().toString();

    const analysis = {
      id: analysisId,
      listeners: [],
      coordinator: new DebateCoordinator()
    };

    activeAnalyses.set(analysisId, analysis);

    // Start analysis in background
    analysis.coordinator.processReport(reportText, (progress) => {
      analysis.listeners.forEach(listener => listener(progress));
    }).catch(error => {
      analysis.listeners.forEach(listener => 
        listener({ state: 'ERROR', message: error.message })
      );
    });

    res.json({ analysisId });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 AETHER Backend running on port ${PORT}`);
});