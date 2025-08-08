const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class FileDatabase {
  constructor() {
    this.usersFile = path.join(__dirname, '../data/users.json');
    this.statsFile = path.join(__dirname, '../data/stats.json');
  }

  // Initialize database files if they don't exist
  async init() {
    try {
      await fs.access(this.usersFile);
    } catch {
      await fs.writeFile(this.usersFile, '[]');
    }

    try {
      await fs.access(this.statsFile);
    } catch {
      await fs.writeFile(this.statsFile, JSON.stringify({
        totalUsers: 0,
        activeUsers: 0,
        registrationsToday: 0
      }));
    }
  }

  // Read users from file
  async readUsers() {
    try {
      const data = await fs.readFile(this.usersFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading users:', error);
      return [];
    }
  }

  // Write users to file
  async saveUsers(users) {
    try {
      await fs.writeFile(this.usersFile, JSON.stringify(users, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving users:', error);
      return false;
    }
  }

  // Find user by email
  async findUserByEmail(email) {
    const users = await this.readUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase());
  }

  // Find user by ID
  async findUserById(id) {
    const users = await this.readUsers();
    return users.find(user => user._id === id);
  }

  // Create new user
  async createUser(userData) {
    try {
      const users = await this.readUsers();
      
      // Check if user already exists
      const existingUser = users.find(user => 
        user.email.toLowerCase() === userData.email.toLowerCase()
      );
      
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create new user object
      const newUser = {
        _id: uuidv4(),
        name: userData.name,
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        phone: userData.phone,
        dateOfBirth: userData.dateOfBirth || null,
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
        newsletterSubscription: userData.newsletterSubscription || false,
        termsAccepted: userData.termsAccepted || false,
        status: 'active',
        emailVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: null,
        loginCount: 0
      };

      // Add to users array
      users.push(newUser);
      
      // Save users
      await this.saveUsers(users);
      
      // Update statistics
      await this.updateStats();
      
      // Return user without password
      const { password, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
      
    } catch (error) {
      throw error;
    }
  }

  // Get all users with pagination
  async getAllUsers(page = 1, limit = 10, status = null) {
    const users = await this.readUsers();
    
    let filteredUsers = users;
    if (status) {
      filteredUsers = users.filter(user => user.status === status);
    }

    // Remove passwords
    filteredUsers = filteredUsers.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    // Sort by creation date (newest first)
    filteredUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return {
      users: paginatedUsers,
      total: filteredUsers.length,
      page,
      totalPages: Math.ceil(filteredUsers.length / limit)
    };
  }

  // Compare password
  async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Get profile photo URL
  getProfilePhotoURL(user) {
    if (user.profilePhoto && user.profilePhoto.filename) {
      return `http://localhost:5000/uploads/profile_photos/${user.profilePhoto.filename}`;
    }
    return null;
  }

  // Update statistics
  async updateStats() {
    try {
      const users = await this.readUsers();
      const today = new Date().toDateString();
      
      const stats = {
        totalUsers: users.length,
        activeUsers: users.filter(user => user.status === 'active').length,
        verifiedEmails: users.filter(user => user.emailVerified).length,
        newsletterSubscribers: users.filter(user => user.newsletterSubscription).length,
        registrationsToday: users.filter(user => 
          new Date(user.createdAt).toDateString() === today
        ).length,
        lastUpdated: new Date().toISOString()
      };
      
      await fs.writeFile(this.statsFile, JSON.stringify(stats, null, 2));
      return stats;
    } catch (error) {
      console.error('Error updating stats:', error);
      return null;
    }
  }

  // Get statistics
  async getStatistics() {
    try {
      const data = await fs.readFile(this.statsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // If stats file doesn't exist, create it
      return await this.updateStats();
    }
  }
}

module.exports = new FileDatabase();
