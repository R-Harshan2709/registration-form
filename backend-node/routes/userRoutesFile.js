const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

// Import File Database
const fileDb = require('../models/FileDatabase');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/profile_photos');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: profile_UUID_timestamp.extension
    const uniqueSuffix = uuidv4() + '_' + Date.now();
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, 'profile_' + uniqueSuffix + extension);
  }
});

// File filter for profile photos
const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP files are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB default
    files: 1
  }
});

// Validation schema - more flexible for form submissions
const registrationSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().trim().max(20).required(),
  date_of_birth: Joi.alternatives().try(
    Joi.date().max('now'),
    Joi.string().allow(''),
    Joi.allow(null)
  ).optional(),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say', '').optional(),
  address: Joi.string().trim().max(500).allow('', null).optional(),
  city: Joi.string().trim().max(100).allow('', null).optional(),
  state: Joi.string().trim().max(100).allow('', null).optional(),
  postal_code: Joi.string().trim().max(20).allow('', null).optional(),
  country: Joi.string().trim().max(100).allow('', null).optional(),
  occupation: Joi.string().trim().max(100).allow('', null).optional(),
  company: Joi.string().trim().max(100).allow('', null).optional(),
  website: Joi.alternatives().try(
    Joi.string().uri({ scheme: ['http', 'https'] }),
    Joi.string().allow(''),
    Joi.allow(null)
  ).optional(),
  emergency_contact_name: Joi.string().trim().max(100).allow('', null).optional(),
  emergency_contact_phone: Joi.string().trim().max(20).allow('', null).optional(),
  newsletter_subscription: Joi.alternatives().try(
    Joi.boolean(),
    Joi.string().valid('true', 'false', ''),
    Joi.allow(null)
  ).optional().default(false),
  terms_accepted: Joi.alternatives().try(
    Joi.boolean().valid(true),
    Joi.string().valid('true')
  ).required()
});

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
router.post('/register', upload.single('profile_photo'), async (req, res) => {
  try {
    console.log('📝 Registration request received');
    console.log('📦 Body data:', Object.keys(req.body));
    console.log('📸 File data:', req.file ? req.file.originalname : 'No file');

    // Preprocess the request body to handle string booleans and empty values
    const processedBody = { ...req.body };
    
    // Convert string booleans to actual booleans
    if (processedBody.newsletter_subscription) {
      processedBody.newsletter_subscription = processedBody.newsletter_subscription === 'true' || processedBody.newsletter_subscription === true;
    }
    
    if (processedBody.terms_accepted) {
      processedBody.terms_accepted = processedBody.terms_accepted === 'true' || processedBody.terms_accepted === true;
    }
    
    // Handle empty string dates
    if (processedBody.date_of_birth === '') {
      processedBody.date_of_birth = null;
    }
    
    console.log('🔧 Processed body:', processedBody);

    // Validate request data
    const { error, value } = registrationSchema.validate(processedBody, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      console.error('❌ Validation errors:', error.details);
      console.error('📦 Request body:', req.body);
      
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Check if user already exists
    const existingUser = await fileDb.findUserByEmail(value.email);
    if (existingUser) {
      // Clean up uploaded file
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Prepare user data
    const userData = {
      name: value.name,
      email: value.email,
      password: value.password,
      phone: value.phone,
      dateOfBirth: value.date_of_birth || null,
      gender: value.gender || null,
      address: value.address || null,
      city: value.city || null,
      state: value.state || null,
      postalCode: value.postal_code || null,
      country: value.country || null,
      occupation: value.occupation || null,
      company: value.company || null,
      website: value.website || null,
      emergencyContactName: value.emergency_contact_name || null,
      emergencyContactPhone: value.emergency_contact_phone || null,
      newsletterSubscription: value.newsletter_subscription || false,
      termsAccepted: value.terms_accepted
    };

    // Handle profile photo if uploaded
    if (req.file) {
      userData.profilePhoto = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      };
    }

    // Create new user using file database
    const savedUser = await fileDb.createUser(userData);

    console.log('✅ User registered successfully:', savedUser.email);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully!',
      data: {
        user_id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        registration_date: savedUser.createdAt,
        profile_photo_url: fileDb.getProfilePhotoURL(savedUser),
        status: savedUser.status
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);

    // Clean up uploaded file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Handle specific errors
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// @desc    Get all users (with pagination and filtering)
// @route   GET /api/users
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    const result = await fileDb.getAllUsers(page, limit, status);

    res.json({
      success: true,
      data: {
        users: result.users,
        pagination: {
          current_page: result.page,
          total_pages: result.totalPages,
          total_users: result.total,
          per_page: limit
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const user = await fileDb.findUserById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: { user: userWithoutPassword }
    });

  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
});

// @desc    Get user statistics
// @route   GET /api/users/stats/summary
// @access  Public
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await fileDb.getStatistics();
    
    res.json({
      success: true,
      data: { statistics: stats }
    });

  } catch (error) {
    console.error('❌ Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size allowed is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one profile photo is allowed.'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
});

module.exports = router;
