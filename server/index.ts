import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import swaggerUi from 'swagger-ui-express';
import specs from './swagger.js';

// Import route modules
import userRoutes from './routes/userRoutes.js';
import giftRoutes from './routes/giftRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5001;

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

// // Handle preflight requests
// app.options('*', cors());

app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to MesaLista API' });
});

// Swagger documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

// Register route modules
app.use('/api/users', userRoutes);
app.use('/api/gifts', giftRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payments', paymentRoutes);

// Special case for login (to maintain /api/login endpoint)
app.post('/api/login', (req, res, next) => {
  // Redirect to the user login route handler
  req.url = '/login';
  next();
});

// Add a specific route for login after the redirect
app.use('/login', userRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

// Handle shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
