import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import swaggerUi from 'swagger-ui-express';
import specs from './swagger.js';

// Import route modules
import userRoutes from './routes/userRoutes.js';
import giftRoutes from './routes/giftRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import fileUploadRouter from './routes/fileUpload.js';
import weddingListRoutes from './routes/weddingListRoutes.js';
import bodyParser from 'body-parser';
import paymentController from './controllers/paymentController.js';

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// Middleware
// For development, allow all origins
app.use(
  cors({
    origin: '*', // Allow all origins in development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    maxAge: 86400, // Cache preflight requests for 24 hours
  }),
);

app.use(express.json());

// Serve static files from the React app build directory
const distPath = path.resolve(__dirname, '../../../dist');
app.use(express.static(distPath));

// API root route
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to MesaLista API' });
});

// Health check endpoint for Railway
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Swagger documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

// Register route modules
app.use('/api/user', userRoutes);
app.use('/api/gift', giftRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wedding-list', weddingListRoutes);
app.use('/api/upload', fileUploadRouter);

// Stripe webhook route - defined after other routes to avoid conflicts
// Note: This bypasses express.json() by using bodyParser.raw directly
app.post('/api/payments/stripe-payment-intent', bodyParser.raw({ type: 'application/json' }), paymentController.handleStripePaymentIntent);

// Mount payment routes last to avoid route conflicts
app.use('/api/payments', paymentRoutes);

// Special case for login (to maintain /api/login endpoint)
app.post('/api/login', (req, res, next) => {
  // Redirect to the user login route handler
  req.url = '/login';
  next();
});

// Add a specific route for login after the redirect
app.use('/login', userRoutes);

// Catch-all handler: send back React's index.html file for SPA routing
// This must be AFTER all API routes to avoid conflicts
app.use((req, res, next) => {
  // Skip if it's an API route
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  // Serve index.html for all non-API routes (SPA routing)
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).json({ error: 'Failed to serve application' });
    }
  });
});

// Error handling middleware (must be last)
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Test database connection on startup (non-blocking)
prisma
  .$connect()
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((error: any) => {
    console.warn('⚠️ Database connection failed, but server will continue:', error.message);
  });

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://0.0.0.0:${PORT}/api`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('🚀 Server started successfully');
});

// Handle server startup errors
server.on('error', (error) => {
  console.error('❌ Server startup error:', error);
  process.exit(1);
});

// Handle shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
