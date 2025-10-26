import express from 'express';
import cors from 'cors';
import { config, validateConfig } from './config';
import analyzeRoutes from './routes/analyze';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', analyzeRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Validate configuration
validateConfig();

// Start server
app.listen(config.port, () => {
  console.log('🚀 Room Designer AI Backend Server');
  console.log(`📡 Server running on port ${config.port}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`✅ Health check: http://localhost:${config.port}/health`);
  console.log('\nAvailable endpoints:');
  console.log(`  POST /api/analyze - Analyze image and get suggestions`);
  console.log(`  POST /api/generate - Generate enhanced images`);
  console.log(`  POST /api/analyze-and-generate - Combined endpoint`);
});

export default app;
