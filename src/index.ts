import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
import xss from 'xss';
import { connectToMongoDB } from './config/database';

// Import routes
import authRoutes from './routes/auth.routes';
import syncRoutes from './routes/sync.routes';
import customerRoutes from './routes/customer.routes';
import paymentRoutes from './routes/payment.routes';
import adminRoutes from './routes/admin.routes';
import appsRoutes from './routes/apps.routes';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 7001;

// Security Middleware
// Configure Helmet with enhanced security headers
app.use(helmet({
  xssFilter: true,
  frameguard: { action: 'deny' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' }
})); 

// Rate limiting to prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
});
app.use('/api/', limiter);

// Request timeout middleware to prevent hanging connections
app.use((req, res, next) => {
  // Set timeout to 30 seconds
  const timeout = 30000;
  const timeoutHandler = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({ message: 'Request timeout' });
    }
  }, timeout);
  
  // Clear the timeout when the response is sent
  res.on('finish', () => {
    clearTimeout(timeoutHandler);
  });
  
  next();
});

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use((req, res, next) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    }
  }
  next();
});

// Prevent parameter pollution
app.use(hpp());

// Parse cookies
app.use(cookieParser());

// CSRF protection - only enable for browser-based routes that need it
// Note: This might interfere with API calls from non-browser clients
// so we're applying it selectively and excluding API routes
const csrfProtection = csrf({ cookie: true });

// Apply CSRF protection selectively (not on API routes)
// For browser routes that need CSRF protection, use the csrfProtection middleware in specific routes

// Set secure cookies
app.set('trust proxy', 1); // trust first proxy if behind a proxy
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    res.cookie('secure', true, {
      secure: true,
      httpOnly: true,
      sameSite: 'strict'
    });
    next();
  });
}

// Content Security Policy
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  })
);

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if(!origin) return callback(null, true);
    
    // Parse allowed origins from environment variable
    const allowedOrigins = process.env.CORS_CLIENT_URLS ? 
      process.env.CORS_CLIENT_URLS.split(',').map(url => url.trim()) : 
      ['https://krios-pos.netlify.app', "http://localhost:5173", "http://localhost:5174",'https://prynova.netlify.app']
    
    if(allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked request from:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/apps', appsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Connect to MongoDB
  try {
    await connectToMongoDB();
    console.log('Connected to MongoDB Atlas');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
});

export default app;