const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// MongoDB imports (will be used when MongoDB is available)
let mongoose = null;
let User = null;

try {
  mongoose = require('mongoose');
  User = require('./User');
} catch (error) {
  console.log('⚠️  MongoDB not available, using file storage only');
}

class DualStorage {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.usersFile = path.join(this.dataDir, 'users.json');
    this.statsFile = path.join(this.dataDir, 'stats.json');
    this.mongoConnected = false;
  }

  async init() {
    // Initialize file storage
    await this.initFileStorage();
    
    // Try to initialize MongoDB if available
    if (mongoose) {
      await this.initMongoStorage();
    }

    console.log('🔄 Dual storage system initialized');
    console.log(`📁 File storage: ${this.mongoConnected ? '✅ Active' : '✅ Primary'}`);
    console.log(`🗄️  MongoDB: ${this.mongoConnected ? '✅ Active' : '❌ Not available'}`);
  }

  async initFileStorage() {
    // Create data directory if it doesn't exist
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }

    // Initialize users.json if it doesn't exist
    try {
      await fs.access(this.usersFile);
    } catch {
      await fs.writeFile(this.usersFile, JSON.stringify([], null, 2));
      console.log('📁 Created users.json file');
    }

    // Initialize stats.json if it doesn't exist
    try {
      await fs.access(this.statsFile);
    } catch {
      const initialStats = {
        totalUsers: 0,
        totalRegistrations: 0,
        lastRegistration: null,
        createdAt: new Date().toISOString()
      };
      await fs.writeFile(this.statsFile, JSON.stringify(initialStats, null, 2));
      console.log('📊 Created stats.json file');
    }
  }

  async initMongoStorage() {
    try {
      if (!mongoose.connection.readyState) {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/registration_system');
      }
      this.mongoConnected = true;
      console.log('🗄️  MongoDB connected for dual storage');
    } catch (error) {
      console.log('⚠️  MongoDB connection failed, using file storage only:', error.message);
      this.mongoConnected = false;
    }
  }

  async createUser(userData) {
    try {
      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Prepare user data
      const newUser = {
        _id: uuidv4(),
        name: userData.name,
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        phone: userData.phone,
        dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : null,
        gender: userData.gender || null,
        address: userData.address || null,
        city: userData.city || null,
        state: userData.state || null,
        postalCode: userData.postalCode || null,
        country: userData.country || null,
        occupation: userData.occupation || null,
        company: userData.company || null,
        website: userData.website || null,
        emergencyContactName: userData.emergencyContactName || null,
        emergencyContactPhone: userData.emergencyContactPhone || null,
        profilePhoto: userData.profilePhoto || null,
        newsletterSubscription: userData.newsletterSubscription === true,
        termsAccepted: userData.termsAccepted === true,
        status: 'active',
        emailVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: null,
        loginCount: 0
      };

      // Save to file storage
      await this.saveToFile(newUser);

      // Save to MongoDB if available
      if (this.mongoConnected && User) {
        await this.saveToMongo(newUser);
      }

      // Update statistics
      await this.updateStats();

      console.log(`✅ User saved to ${this.mongoConnected ? 'both file and MongoDB' : 'file storage'}: ${newUser.email}`);
      
      // Return user without password
      const { password, ...userWithoutPassword } = newUser;
      return userWithoutPassword;

    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }

  async saveToFile(userData) {
    try {
      // Read current users
      const usersData = await fs.readFile(this.usersFile, 'utf8');
      const users = JSON.parse(usersData);

      // Check if user already exists
      const existingUser = users.find(u => u.email === userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Add new user
      users.push(userData);

      // Save back to file
      await fs.writeFile(this.usersFile, JSON.stringify(users, null, 2));
      console.log('📁 User saved to file storage');

    } catch (error) {
      console.error('❌ Error saving to file:', error);
      throw error;
    }
  }

  async saveToMongo(userData) {
    try {
      // Convert _id to MongoDB ObjectId format for compatibility
      const mongoData = { ...userData };
      delete mongoData._id; // Let MongoDB generate its own _id

      const user = new User(mongoData);
      await user.save();
      
      console.log('🗄️  User saved to MongoDB');
    } catch (error) {
      console.error('⚠️  Error saving to MongoDB (file storage still succeeded):', error.message);
      // Don't throw error here - file storage already succeeded
    }
  }

  async findUserByEmail(email) {
    try {
      // Try MongoDB first if available
      if (this.mongoConnected && User) {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
          console.log('🔍 User found in MongoDB');
          return user;
        }
      }

      // Fallback to file storage
      const usersData = await fs.readFile(this.usersFile, 'utf8');
      const users = JSON.parse(usersData);
      const user = users.find(u => u.email === email.toLowerCase());
      
      if (user) {
        console.log('🔍 User found in file storage');
      }
      
      return user || null;

    } catch (error) {
      console.error('❌ Error finding user:', error);
      throw error;
    }
  }

  async getAllUsers() {
    try {
      // Try MongoDB first if available
      if (this.mongoConnected && User) {
        const users = await User.find({}).select('-password');
        if (users.length > 0) {
          console.log(`🔍 Found ${users.length} users in MongoDB`);
          return users;
        }
      }

      // Fallback to file storage
      const usersData = await fs.readFile(this.usersFile, 'utf8');
      const users = JSON.parse(usersData);
      
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      
      console.log(`🔍 Found ${users.length} users in file storage`);
      return usersWithoutPasswords;

    } catch (error) {
      console.error('❌ Error getting users:', error);
      throw error;
    }
  }

  async updateStats() {
    try {
      const statsData = await fs.readFile(this.statsFile, 'utf8');
      const stats = JSON.parse(statsData);

      stats.totalRegistrations += 1;
      stats.lastRegistration = new Date().toISOString();

      // Count current users
      const usersData = await fs.readFile(this.usersFile, 'utf8');
      const users = JSON.parse(usersData);
      stats.totalUsers = users.length;

      await fs.writeFile(this.statsFile, JSON.stringify(stats, null, 2));
      console.log('📊 Statistics updated');

    } catch (error) {
      console.error('⚠️  Error updating stats:', error);
      // Don't throw - stats update is not critical
    }
  }

  async getStats() {
    try {
      const statsData = await fs.readFile(this.statsFile, 'utf8');
      return JSON.parse(statsData);
    } catch (error) {
      console.error('❌ Error reading stats:', error);
      return {
        totalUsers: 0,
        totalRegistrations: 0,
        lastRegistration: null,
        error: 'Could not read statistics'
      };
    }
  }

  // Health check method
  getStorageStatus() {
    return {
      fileStorage: {
        status: 'active',
        location: this.usersFile
      },
      mongoStorage: {
        status: this.mongoConnected ? 'active' : 'unavailable',
        connection: this.mongoConnected
      },
      mode: this.mongoConnected ? 'dual' : 'file-only'
    };
  }
}

module.exports = new DualStorage();
