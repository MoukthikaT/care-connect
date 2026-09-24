import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is required.');
  }

  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000
  });

  console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
};
