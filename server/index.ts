import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
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
import emailRoutes from './routes/emailRoutes.js';
import emailVerificationRoutes from './routes/emailVerificationRoutes.js';
import fileUploadRouter from './routes/fileUpload.js';
import weddingListRoutes from './routes/weddingListRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import predesignedListRoutes from './routes/predesignedListRoutes.js';
import discountCodeRoutes from './routes/discountCodeRoutes.js';
import bodyParser from 'body-parser';
import paymentController from './controllers/paymentController.js';

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Import session cleanup
import SessionCleanupJob from './lib/sessionCleanup.js';
import AnalyticsAggregationJob from './lib/analyticsAggregation.js';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// Redirect non-www to www in production
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    const host = req.get('host');
    if (host === 'mesalista.com.mx') {
      return res.redirect(301, `https://www.mesalista.com.mx${req.url}`);
    }
  }
  next();
});

// Middleware
// For development, allow specific origins with credentials
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://www.mesalista.com.mx', 'https://mesalista.com.mx'] // Allow both for transition period
        : ['http://localhost:5173', 'http://127.0.0.1:5173'], // Development origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    maxAge: 86400, // Cache preflight requests for 24 hours
  }),
);

// Cookie parser middleware (must be before routes that use cookies)
app.use(cookieParser());

// Stripe webhook route with conditional body parsing
app.use('/api/payments/stripe-payment-intent', (req, res, next) => {
  // Skip JSON parsing for webhook route
  if (req.method === 'POST') {
    return bodyParser.raw({ type: 'application/json' })(req, res, next);
  }
  next();
});

app.post('/api/payments/stripe-payment-intent', paymentController.handleStripePaymentIntent);

// Apply JSON parsing to all other routes
app.use((req, res, next) => {
  // Skip JSON parsing for webhook route
  if (req.path === '/api/payments/stripe-payment-intent') {
    return next();
  }
  express.json()(req, res, next);
});

// PayPal routes (after JSON parsing middleware)
app.post('/api/payments/create-paypal-order', paymentController.createPayPalOrder);
app.post('/api/payments/capture-paypal-payment', paymentController.capturePayPalPayment);

// Serve static files from the React app build directory
// Dynamically resolve path based on whether we're running from TypeScript or compiled JS
// Development (tsx): __dirname = /path/to/MesaLista/server -> ../dist
// Production (node): __dirname = /path/to/MesaLista/server/dist/dist/dist/server -> ../../../dist
const isDevelopment = __filename.endsWith('.ts');
const distPath = isDevelopment
  ? path.resolve(__dirname, '../dist') // Development: server/index.ts -> dist/
  : path.resolve(__dirname, '../../../dist'); // Production: server/dist/server/index.js -> dist/

console.log(`[Static Files] Serving from: ${distPath} (${isDevelopment ? 'development' : 'production'} mode)`);
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
app.use('/api/payments', paymentRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/email-verification', emailVerificationRoutes);
app.use('/api/wedding-list', weddingListRoutes);
app.use('/api/upload', fileUploadRouter);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/predesigned-lists', predesignedListRoutes);
app.use('/api/discount-codes', discountCodeRoutes);

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
    // Start session cleanup job after database connection
    SessionCleanupJob.start();
    // Start analytics aggregation job
    AnalyticsAggregationJob.start();
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
  console.log('Shutting down server...');
  SessionCleanupJob.stop();
  AnalyticsAggregationJob.stop();
  await prisma.$disconnect();
  process.exit(0);
});
