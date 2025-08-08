const express = require('express');
const multer = require('multer');
const path = require('path');
const Joi = require('joi');
const dualStorage = require('../models/DualStorage');

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/profile_photos');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    const fileExtension = path.extname(file.originalname);
    const fileName = `profile_${req.body.email || 'user'}_${uniqueSuffix}${fileExtension}`;
    cb(null, fileName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Enhanced validation schema with flexible data types
const registrationSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().trim().max(20).required(),
  date_of_birth: Joi.alternatives().try(
    Joi.date().iso(),
    Joi.string().allow('').optional(),
    Joi.allow(null)
  ).optional(),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say', '').allow(null).optional(),
  address: Joi.string().trim().max(500).allow('').optional(),
  city: Joi.string().trim().max(100).allow('').optional(),
  state: Joi.string().trim().max(100).allow('').optional(),
  postal_code: Joi.string().trim().max(20).allow('').optional(),
  country: Joi.string().trim().max(100).allow('').optional(),
  occupation: Joi.string().trim().max(100).allow('').optional(),
  company: Joi.string().trim().max(100).allow('').optional(),
  website: Joi.string().allow('').optional().custom((value, helpers) => {
    if (!value || value === '') return value;
    
    // Add http:// if no protocol is specified
    if (!value.match(/^https?:\/\//i)) {
      value = 'http://' + value;
    }
    
    // Validate the URL
    try {
      new URL(value);
      return value;
    } catch (error) {
      return helpers.error('string.uri');
    }
  }),
  emergency_contact_name: Joi.string().trim().max(100).allow('').optional(),
  emergency_contact_phone: Joi.string().trim().max(20).allow('').optional(),
  newsletter_subscription: Joi.alternatives().try(
    Joi.boolean(),
    Joi.string().valid('true', 'false', '1', '0'),
    Joi.number().valid(0, 1)
  ).optional(),
  terms_accepted: Joi.alternatives().try(
    Joi.boolean(),
    Joi.string().valid('true', 'false', '1', '0'),
    Joi.number().valid(0, 1)
  ).required()
});

// Preprocess form data to handle type conversions
function preprocessFormData(data) {
  const processed = { ...data };

  // Convert string booleans to actual booleans
  if (processed.newsletter_subscription !== undefined) {
    if (typeof processed.newsletter_subscription === 'string') {
      processed.newsletter_subscription = processed.newsletter_subscription.toLowerCase() === 'true' || processed.newsletter_subscription === '1';
    } else if (typeof processed.newsletter_subscription === 'number') {
      processed.newsletter_subscription = processed.newsletter_subscription === 1;
    }
  }

  if (processed.terms_accepted !== undefined) {
    if (typeof processed.terms_accepted === 'string') {
      processed.terms_accepted = processed.terms_accepted.toLowerCase() === 'true' || processed.terms_accepted === '1';
    } else if (typeof processed.terms_accepted === 'number') {
      processed.terms_accepted = processed.terms_accepted === 1;
    }
  }

  // Handle empty date strings
  if (processed.date_of_birth === '') {
    processed.date_of_birth = null;
  }

  // Handle empty strings for optional fields
  ['gender', 'address', 'city', 'state', 'postal_code', 'country', 'occupation', 'company', 'website', 'emergency_contact_name', 'emergency_contact_phone'].forEach(field => {
    if (processed[field] === '') {
      processed[field] = null;
    }
  });

  return processed;
}

// POST /api/users/register - Register a new user
router.post('/register', upload.single('profile_photo'), async (req, res) => {
  try {
    console.log('📝 Registration request received');
    console.log('📦 Body data:', Object.keys(req.body));
    console.log('📸 File data:', req.file ? req.file.originalname : 'No file');

    // Preprocess the form data
    const processedBody = preprocessFormData(req.body);
    console.log('🔧 Processed body:', processedBody);

    // Validate the request body
    const { error, value } = registrationSchema.validate(processedBody, {
      stripUnknown: true,
      abortEarly: false
    });

    if (error) {
      console.log('❌ Validation error:', error.details);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    // Prepare user data
    const userData = {
      ...value,
      dateOfBirth: value.date_of_birth,
      postalCode: value.postal_code,
      emergencyContactName: value.emergency_contact_name,
      emergencyContactPhone: value.emergency_contact_phone,
      newsletterSubscription: value.newsletter_subscription,
      termsAccepted: value.terms_accepted
    };

    // Add profile photo info if uploaded
    if (req.file) {
      userData.profilePhoto = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      };
      console.log('📸 Profile photo saved:', req.file.filename);
    }

    // Create user using dual storage
    const newUser = await dualStorage.createUser(userData);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        createdAt: newUser.createdAt,
        profilePhoto: newUser.profilePhoto ? {
          filename: newUser.profilePhoto.filename,
          originalName: newUser.profilePhoto.originalName
        } : null
      },
      storage: dualStorage.getStorageStatus()
    });

  } catch (error) {
    console.error('💥 Registration error:', error);

    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/users - Get all users (for admin purposes)
router.get('/', async (req, res) => {
  try {
    const users = await dualStorage.getAllUsers();
    const stats = await dualStorage.getStats();

    res.json({
      success: true,
      users: users,
      stats: stats,
      storage: dualStorage.getStorageStatus()
    });

  } catch (error) {
    console.error('💥 Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/users/:email - Get user by email
router.get('/:email', async (req, res) => {
  try {
    const user = await dualStorage.findUserByEmail(req.params.email);
    
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
      user: userWithoutPassword,
      storage: dualStorage.getStorageStatus()
    });

  } catch (error) {
    console.error('💥 Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/users/stats - Get registration statistics
router.get('/admin/stats', async (req, res) => {
  try {
    const stats = await dualStorage.getStats();
    
    res.json({
      success: true,
      stats: stats,
      storage: dualStorage.getStorageStatus()
    });

  } catch (error) {
    console.error('💥 Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
