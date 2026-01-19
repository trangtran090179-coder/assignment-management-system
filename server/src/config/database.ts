const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    console.log('[DATABASE] Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('[DATABASE] ✅ MongoDB connected successfully!');
  } catch (error) {
    console.error('[DATABASE] ❌ Unable to connect to MongoDB:', error);
    // Don't exit process, allow app to start in development
    setTimeout(() => connectDatabase(), 5000);
  }
};

export { connectDatabase };