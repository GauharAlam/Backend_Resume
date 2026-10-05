/**
 * Server Entry Point
 * Main Express server configuration
 */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet());

// Rate Limiting (trust proxy set before limiter for correct req.ip)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter);

// Import utilities
const ApiError = require('./src/utils/ApiError');
const { HTTP_STATUS } = require('./src/utils/constants');
const { getAllowedCorsOrigins, isProduction } = require('./src/utils/env');

// =============================================================================
// MIDDLEWARE CONFIGURATION
// =============================================================================

// CORS Configuration - fail-closed in production
const allowedOrigins = getAllowedCorsOrigins();
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser or same-origin requests without Origin header
    if (!origin) return callback(null, true);
    // In non-production, allow localhost/127.0.0.1 on any port to avoid dev-port lock issues.
    if (!isProduction && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Fail-closed: never allowlist by domain suffix in production.
    // Set CORS_ORIGINS explicitly in hosting dashboard.
    if (isProduction) {
      console.error(`🚫 CORS blocked origin with no allowlist match: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Body Parser Configuration - 2MB global (resumes are ~50KB JSON;
// 50MB allowed AI bill abuse + Vercel 4.5MB limit + memory DoS)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));

// =============================================================================
// DATABASE CONNECTION
// =============================================================================

const MONGO_URI = process.env.MONGO_URI;

// Fail-fast config warnings (boot continues for serverless, but routes return 503)
if (!process.env.CLERK_SECRET_KEY) {
  console.error('❌ CLERK_SECRET_KEY is missing — all authenticated routes will 401/500. Set it in hosting dashboard.');
}
if (!process.env.OPENROUTER_API_KEY && !process.env.NVIDIA_API_KEY) {
  console.error('❌ No AI API key set (OPENROUTER_API_KEY / NVIDIA_API_KEY) — /api/ai/* will return 503.');
}

let isMongoConnected = false;
let mongoError = null;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not defined in environment variables');
  mongoError = 'MONGO_URI is missing';
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Exiting: MONGO_URI is required in production');
    // Do not exit in serverless (Vercel) where process may be reused; but log strongly
  }
} else {
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('✅ MongoDB connected successfully');
      isMongoConnected = true;
      mongoError = null;
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err);
      mongoError = err.message;
      isMongoConnected = false;
    });

  // Monitor connection events for accurate health status
  mongoose.connection.on('connected', () => { isMongoConnected = true; mongoError = null; });
  mongoose.connection.on('error', (err) => { isMongoConnected = false; mongoError = err.message; });
  mongoose.connection.on('disconnected', () => { isMongoConnected = false; });
}

// =============================================================================
// ROUTES
// =============================================================================

// Root endpoint - liveness (always 200) + minimal status (no error internals in prod)
app.get('/', (req, res) => {
  const dbStatus = isMongoConnected ? 'connected' : 'disconnected';
  res.status(200).json({
    success: true,
    message: '🚀 AI Resume Builder Backend Status',
    status: {
      database: isMongoConnected ? '✅ Connected' : '❌ Disconnected',
      environment: process.env.NODE_ENV || 'development',
      cors: {
        configuredCount: allowedOrigins.length,
      },
      security: {
        helmet: '✅ Active',
        rateLimit: '✅ Active'
      }
    },
    ...(process.env.NODE_ENV !== 'production' && mongoError ? { dbError: mongoError } : {}),
    action_required: (!isMongoConnected || allowedOrigins.length === 0)
      ? 'Please check your environment variables in your hosting dashboard.'
      : 'None. System is healthy.',
    _db: dbStatus,
  });
});

// API Routes
const routes = require('./routes');
app.use('/api', routes);

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 Handler
app.use((req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err?.message || err);

  // Handle ApiError instances
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
    });
  }

  // Map AI provider / timeout errors to safe public messages (no key/model leak)
  const aiStatus = err?.status || err?.statusCode;
  if (err?.code === 'AI_TIMEOUT' || aiStatus === 504) {
    return res.status(504).json({ success: false, message: 'AI request timed out, please try again' });
  }
  if (aiStatus === 429 || err?.code === 'rate_limit_exceeded' || err?.type === 'rate_limit_error') {
    return res.status(429).json({ success: false, message: 'AI is busy, please try again in a moment' });
  }
  if (aiStatus === 401 || aiStatus === 403) {
    return res.status(503).json({ success: false, message: 'AI service is temporarily unavailable' });
  }
  if (aiStatus === 503 || err?.code === 'insufficient_quota' || err?.type === 'insufficient_quota') {
    return res.status(503).json({ success: false, message: 'AI service is temporarily unavailable, please try again later' });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // Handle duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // Default error response (hide internals; err.status from validators is trusted)
  const status = err.status || err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const safeStatus = [400, 401, 403, 404, 409, 429, 503, 504].includes(status) ? status : 500;
  res.status(safeStatus).json({
    success: false,
    message: safeStatus === 500 ? 'Internal server error' : (err.message || 'Request failed'),
  });
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Allowed CORS Origins: ${allowedOrigins.length > 0 ? allowedOrigins.join(', ') : 'None (Only local allowed)'}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Error: Port ${PORT} is already in use.`);
    console.log('💡 Tip: Try killing the process with: lsof -ti :5001 | xargs kill -9');
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
  }
});

module.exports = app;
