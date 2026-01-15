require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();
const pdf = require('pdf-parse'); // Renamed to 'pdf' to avoid naming conflicts
const mammoth = require('mammoth');
const { DebateCoordinator } = require('./coordinator');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Store active analyses (In-memory for development)
const activeAnalyses = new Map();

/**
 * Helper to extract text from various file types.
 * Now supports images (PNG, JPG) for multimodal analysis.
 */
async function extractText(file) {
  const buffer = file.buffer;
  
  // Check if it's an image
  if (file.mimetype.startsWith('image/')) {
    // For images, we return a special object with the image data
    const base64Image = buffer.toString('base64');
    return {
      type: 'image',
      mimetype: file.mimetype,
      data: base64Image,
      text: '[Image uploaded for analysis - Chart/Diagram will be analyzed by vision model]'
    };
  }
  
  if (file.mimetype === 'application/pdf') {
    try {
      const parse = typeof pdf === 'function' ? pdf : pdf.default || pdf;
      const data = await parse(buffer);
      return { type: 'text', text: data.text };
    } catch (error) {
      console.error('PDF Parsing Logic Error:', error);
      throw new Error('Could not parse PDF. Ensure the file is not password protected.');
    }
  } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer });
    return { type: 'text', text: result.value };
  } else if (file.mimetype === 'text/plain') {
    return { type: 'text', text: buffer.toString('utf-8') };
  } else {
    throw new Error('Unsupported file type. Please upload a PDF, DOCX, TXT, or image file (PNG/JPG).');
  }
}

/**
 * SSE Endpoint: Streams the "Debate" progress to the frontend.
 */
app.get('/api/analysis/:id/stream', (req, res) => {
  const analysisId = req.params.id;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const analysis = activeAnalyses.get(analysisId);
  if (!analysis) {
    res.write(`data: ${JSON.stringify({ error: 'Analysis session not found' })}\n\n`);
    res.end();
    return;
  }

  // Define a named listener so we can remove it later
  const sendUpdate = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  analysis.listeners.push(sendUpdate);

  // Cleanup when user closes the connection/tab
  req.on('close', () => {
    const idx = analysis.listeners.indexOf(sendUpdate);
    if (idx > -1) analysis.listeners.splice(idx, 1);
  });
});

/**
 * POST Endpoint: Accepts the file and triggers the multi-agent debate.
 */
app.post('/api/analyze', upload.single('report'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // 1. Extract the text/image from the file
    const reportData = await extractText(req.file);
    
    // 2. Create a unique ID for this analysis session
    const analysisId = Date.now().toString();

    // 3. Initialize the session state
    const analysis = {
      id: analysisId,
      listeners: [],
      coordinator: new DebateCoordinator()
    };

    activeAnalyses.set(analysisId, analysis);

    // 4. Start the AI Coordinator in the background (Non-blocking)
    analysis.coordinator.processReport(reportData, (progress) => {
      // Push progress updates to all connected listeners (SSE)
      analysis.listeners.forEach(listener => listener(progress));
    }).catch(error => {
      console.error('Coordinator Error:', error);
      analysis.listeners.forEach(listener => 
        listener({ state: 'ERROR', message: error.message })
      );
    });

    // 5. Respond immediately with the ID so the frontend can start listening
    res.json({ analysisId });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Basic Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'AETHER-Backend',
    timestamp: new Date().toISOString() 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 AETHER Backend running on port ${PORT}`);
});