const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema Definition
const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },

  // Personal Details
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value < new Date();
      },
      message: 'Date of birth cannot be in the future'
    }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    lowercase: true
  },

  // Address Information
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  city: {
    type: String,
    trim: true,
    maxlength: [100, 'City cannot exceed 100 characters']
  },
  state: {
    type: String,
    trim: true,
    maxlength: [100, 'State cannot exceed 100 characters']
  },
  postalCode: {
    type: String,
    trim: true,
    maxlength: [20, 'Postal code cannot exceed 20 characters']
  },
  country: {
    type: String,
    trim: true,
    maxlength: [100, 'Country cannot exceed 100 characters']
  },

  // Professional Information
  occupation: {
    type: String,
    trim: true,
    maxlength: [100, 'Occupation cannot exceed 100 characters']
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company cannot exceed 100 characters']
  },
  website: {
    type: String,
    trim: true,
    validate: {
      validator: function(value) {
        if (!value) return true;
        return /^https?:\/\/.+/.test(value);
      },
      message: 'Website must be a valid URL starting with http:// or https://'
    }
  },

  // Emergency Contact
  emergencyContactName: {
    type: String,
    trim: true,
    maxlength: [100, 'Emergency contact name cannot exceed 100 characters']
  },
  emergencyContactPhone: {
    type: String,
    trim: true,
    maxlength: [20, 'Emergency contact phone cannot exceed 20 characters']
  },

  // Profile Photo
  profilePhoto: {
    filename: {
      type: String,
      default: null
    },
    originalName: {
      type: String,
      default: null
    },
    mimetype: {
      type: String,
      default: null
    },
    size: {
      type: Number,
      default: null
    },
    path: {
      type: String,
      default: null
    }
  },

  // Preferences
  newsletterSubscription: {
    type: Boolean,
    default: false
  },
  termsAccepted: {
    type: Boolean,
    required: [true, 'You must accept the terms and conditions'],
    validate: {
      validator: function(value) {
        return value === true;
      },
      message: 'Terms and conditions must be accepted'
    }
  },

  // System Fields
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'suspended'],
    default: 'active'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  toJSON: { 
    transform: function(doc, ret) {
      delete ret.password; // Never return password in JSON
      return ret;
    }
  },
  toObject: { 
    transform: function(doc, ret) {
      delete ret.password; // Never return password in object
      return ret;
    }
  }
});

// Indexes for better performance (email index is already created by unique: true)
userSchema.index({ createdAt: -1 });
userSchema.index({ status: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get profile photo URL
userSchema.methods.getProfilePhotoURL = function() {
  if (this.profilePhoto && this.profilePhoto.filename) {
    return `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/uploads/profile_photos/${this.profilePhoto.filename}`;
  }
  return null;
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to get user statistics
userSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        verifiedEmails: { $sum: { $cond: ['$emailVerified', 1, 0] } },
        newsletterSubscribers: { $sum: { $cond: ['$newsletterSubscription', 1, 0] } }
      }
    }
  ]);
  
  return stats[0] || {
    totalUsers: 0,
    activeUsers: 0,
    verifiedEmails: 0,
    newsletterSubscribers: 0
  };
};

// Virtual for full profile photo URL
userSchema.virtual('profilePhotoURL').get(function() {
  return this.getProfilePhotoURL();
});

// Ensure virtual fields are included in JSON
userSchema.set('toJSON', { virtuals: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
