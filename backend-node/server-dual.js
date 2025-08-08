const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import routes and dual storage
const userRoutes = require('./routes/userRoutesDual');
const dualStorage = require('./models/DualStorage');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize dual storage system
dualStorage.init().then(() => {
  console.log('🔄 Dual storage system ready');
}).catch(console.error);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/profile_photos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory:', uploadsDir);
}

// Serve static files (uploaded photos)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const storageStatus = dualStorage.getStorageStatus();
  
  res.json({
    status: 'success',
    message: `Registration API is running with Dual Storage!`,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '2.0.0 - Dual Storage',
    storage: storageStatus
  });
});

// Root endpoint
app.get('/', (req, res) => {
  const storageStatus = dualStorage.getStorageStatus();
  
  res.json({
    message: '🚀 Registration System Backend API - Dual Storage Edition',
    version: '2.0.0',
    storage: storageStatus,
    endpoints: {
      health: '/api/health',
      register: '/api/users/register',
      users: '/api/users',
      stats: '/api/users/admin/stats'
    },
    documentation: 'Visit /api/health for system status'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('💥 Error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server gracefully...');
  
  // Close MongoDB connection if it exists
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState) {
      await mongoose.connection.close();
      console.log('🗄️  MongoDB connection closed');
    }
  } catch (error) {
    console.log('📁 File storage only mode - no MongoDB to close');
  }
  
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 ===== DUAL STORAGE REGISTRATION BACKEND STARTED =====');
  console.log(`🌐 Server running on http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Data directory: ${path.join(__dirname, 'data')}`);
  console.log(`📸 Uploads: ${uploadsDir}`);
  console.log('=========================================================');
  console.log('💡 Ready to accept registrations!');
  console.log('🌐 Frontend: http://localhost:3000');
  console.log('🔧 Health check: http://localhost:5000/api/health');
  console.log('📊 Statistics: http://localhost:5000/api/users/admin/stats');
  console.log('🔄 Storage: File + MongoDB (when available)');
});

module.exports = app;
