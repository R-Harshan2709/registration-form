const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

// Import User model
const User = require('../models/User');

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

// Validation schema
const registrationSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().trim().max(20).required(),
  date_of_birth: Joi.date().max('now').allow('', null).optional(),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').allow('').optional(),
  address: Joi.string().trim().max(500).allow('').optional(),
  city: Joi.string().trim().max(100).allow('').optional(),
  state: Joi.string().trim().max(100).allow('').optional(),
  postal_code: Joi.string().trim().max(20).allow('').optional(),
  country: Joi.string().trim().max(100).allow('').optional(),
  occupation: Joi.string().trim().max(100).allow('').optional(),
  company: Joi.string().trim().max(100).allow('').optional(),
  website: Joi.string().uri({ scheme: ['http', 'https'] }).allow('').optional(),
  emergency_contact_name: Joi.string().trim().max(100).allow('').optional(),
  emergency_contact_phone: Joi.string().trim().max(20).allow('').optional(),
  newsletter_subscription: Joi.boolean().default(false),
  terms_accepted: Joi.boolean().valid(true).required()
});

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
router.post('/register', upload.single('profile_photo'), async (req, res) => {
  try {
    console.log('📝 Registration request received');
    console.log('📦 Body data:', Object.keys(req.body));
    console.log('📸 File data:', req.file ? req.file.originalname : 'No file');

    // Validate request data
    const { error, value } = registrationSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      
      const validationErrors = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(value.email);
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
      termsAccepted: value.terms_accepted,
      status: 'active'
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

    // Create new user
    const newUser = new User(userData);
    const savedUser = await newUser.save();

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
        profile_photo_url: savedUser.getProfilePhotoURL(),
        status: savedUser.status
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);

    // Clean up uploaded file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
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
// @access  Public (should be protected in production)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    
    const query = {};
    if (status) {
      query.status = status;
    }

    const users = await User.find(query)
      .select('-password') // Exclude password field
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_users: total,
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
// @access  Public (should be protected in production)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
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
// @access  Public (should be protected in production)
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await User.getStatistics();
    
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
