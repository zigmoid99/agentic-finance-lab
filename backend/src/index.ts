import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/authRoutes';
import groupRoutes from './routes/groupRoutes';
import photoRoutes from './routes/photoRoutes';
import voteRoutes from './routes/voteRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;
const API_PREFIX = process.env.API_PREFIX || '/api';

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/groups`, groupRoutes);
app.use(`${API_PREFIX}/photos`, photoRoutes);
app.use(`${API_PREFIX}/photos`, voteRoutes);

// Serve uploaded files (in production, use CDN or cloud storage)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║  Community Photo Sharing API               ║
║                                            ║
║  Server running on port ${PORT}            ║
║  Environment: ${process.env.NODE_ENV || 'development'}              ║
║  API Prefix: ${API_PREFIX}                      ║
║                                            ║
║  Endpoints:                                ║
║  - GET  /health                            ║
║  - POST ${API_PREFIX}/auth/register              ║
║  - POST ${API_PREFIX}/auth/login                 ║
║  - GET  ${API_PREFIX}/groups                     ║
║  - POST ${API_PREFIX}/photos                     ║
║                                            ║
╚════════════════════════════════════════════╝
  `);
});

export default app;
