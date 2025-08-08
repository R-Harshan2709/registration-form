const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const User = require('./models/User');
require('dotenv').config();

/**
 * Migration script to sync existing JSON file users to MongoDB
 * This ensures both storage systems have the same data
 */
class DataMigration {
  constructor() {
    this.usersFile = path.join(__dirname, 'data', 'users.json');
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/registration_system');
      console.log('🗄️  MongoDB connected for migration');
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      return false;
    }
  }

  async readUsersFromFile() {
    try {
      const usersData = await fs.readFile(this.usersFile, 'utf8');
      const users = JSON.parse(usersData);
      console.log(`📁 Found ${users.length} users in JSON file`);
      return users;
    } catch (error) {
      console.error('❌ Error reading users file:', error.message);
      return [];
    }
  }

  async migrateUsers() {
    console.log('🔄 Starting user migration to MongoDB...');

    // Connect to MongoDB
    const connected = await this.connect();
    if (!connected) {
      console.log('❌ Migration aborted - MongoDB not available');
      return;
    }

    // Read users from file
    const fileUsers = await this.readUsersFromFile();
    if (fileUsers.length === 0) {
      console.log('📭 No users to migrate');
      return;
    }

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const fileUser of fileUsers) {
      try {
        // Check if user already exists in MongoDB
        const existingUser = await User.findOne({ email: fileUser.email });
        
        if (existingUser) {
          console.log(`⏭️  User already exists in MongoDB: ${fileUser.email}`);
          skippedCount++;
          continue;
        }

        // Create new user in MongoDB
        const mongoUser = new User({
          name: fileUser.name,
          email: fileUser.email,
          password: fileUser.password, // Already hashed from file
          phone: fileUser.phone,
          dateOfBirth: fileUser.dateOfBirth ? new Date(fileUser.dateOfBirth) : null,
          gender: fileUser.gender,
          address: fileUser.address,
          city: fileUser.city,
          state: fileUser.state,
          postalCode: fileUser.postalCode,
          country: fileUser.country,
          occupation: fileUser.occupation,
          company: fileUser.company,
          website: fileUser.website,
          emergencyContactName: fileUser.emergencyContactName,
          emergencyContactPhone: fileUser.emergencyContactPhone,
          profilePhoto: fileUser.profilePhoto,
          newsletterSubscription: fileUser.newsletterSubscription,
          termsAccepted: fileUser.termsAccepted,
          status: fileUser.status || 'active',
          emailVerified: fileUser.emailVerified || false,
          createdAt: fileUser.createdAt ? new Date(fileUser.createdAt) : new Date(),
          updatedAt: fileUser.updatedAt ? new Date(fileUser.updatedAt) : new Date(),
          lastLogin: fileUser.lastLogin ? new Date(fileUser.lastLogin) : null,
          loginCount: fileUser.loginCount || 0
        });

        await mongoUser.save();
        console.log(`✅ Migrated user: ${fileUser.email}`);
        migratedCount++;

      } catch (error) {
        console.error(`❌ Error migrating user ${fileUser.email}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount} users`);
    console.log(`⏭️  Skipped (already exist): ${skippedCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);
    console.log(`📁 Total in file: ${fileUsers.length} users`);

    await mongoose.connection.close();
    console.log('🗄️  MongoDB connection closed');
  }

  async syncFromMongoToFile() {
    console.log('🔄 Starting sync from MongoDB to file...');

    // Connect to MongoDB
    const connected = await this.connect();
    if (!connected) {
      console.log('❌ Sync aborted - MongoDB not available');
      return;
    }

    try {
      // Get all users from MongoDB
      const mongoUsers = await User.find({});
      console.log(`🗄️  Found ${mongoUsers.length} users in MongoDB`);

      // Read current file users
      const fileUsers = await this.readUsersFromFile();
      
      // Convert MongoDB users to file format
      const convertedUsers = mongoUsers.map(user => ({
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        password: user.password,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString() : null,
        gender: user.gender,
        address: user.address,
        city: user.city,
        state: user.state,
        postalCode: user.postalCode,
        country: user.country,
        occupation: user.occupation,
        company: user.company,
        website: user.website,
        emergencyContactName: user.emergencyContactName,
        emergencyContactPhone: user.emergencyContactPhone,
        profilePhoto: user.profilePhoto,
        newsletterSubscription: user.newsletterSubscription,
        termsAccepted: user.termsAccepted,
        status: user.status,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: user.updatedAt ? user.updatedAt.toISOString() : new Date().toISOString(),
        lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
        loginCount: user.loginCount
      }));

      // Write to file
      await fs.writeFile(this.usersFile, JSON.stringify(convertedUsers, null, 2));
      console.log(`✅ Synced ${convertedUsers.length} users from MongoDB to file`);

    } catch (error) {
      console.error('❌ Error syncing from MongoDB to file:', error.message);
    }

    await mongoose.connection.close();
    console.log('🗄️  MongoDB connection closed');
  }
}

// CLI usage
async function main() {
  const migration = new DataMigration();
  const action = process.argv[2];

  switch (action) {
    case 'to-mongo':
      await migration.migrateUsers();
      break;
    
    case 'to-file':
      await migration.syncFromMongoToFile();
      break;
    
    default:
      console.log('📋 Usage:');
      console.log('  node migrate.js to-mongo    # Migrate users from JSON file to MongoDB');
      console.log('  node migrate.js to-file     # Sync users from MongoDB to JSON file');
      break;
  }

  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = DataMigration;
