// API Configuration
const config = {
  // Backend API base URL
  API_BASE_URL: 'http://localhost/registration-form/backend',
  
  // Specific endpoints
  ENDPOINTS: {
    REGISTER: 'http://localhost/registration-form/backend/register_new.php',
    UPLOAD: 'http://localhost/registration-form/backend/upload.php'
  },
  
  // File upload settings
  UPLOAD_SETTINGS: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    UPLOAD_TIMEOUT: 30000 // 30 seconds
  },
  
  // Request settings
  REQUEST_TIMEOUT: 15000, // 15 seconds
  
  // Environment check
  isDevelopment: process.env.NODE_ENV === 'development',
  
  // Debug mode
  DEBUG: true
};

export default config;
