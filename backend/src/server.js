import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import app from './app.js';
import { connectDB } from './config/db.js';
import { configureCloudinary } from './config/cloudinary.js';
import { ensureSystemAccounts } from './services/systemAccountService.js';
import { ensureDefaultCategories } from './services/categorySeederService.js';

dotenv.config({
  path: fileURLToPath(new URL('../.env', import.meta.url))
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await ensureSystemAccounts();
    await ensureDefaultCategories();
    console.log('[Database] Connected successfully.');

    configureCloudinary();

    const server = app.listen(PORT, () => {
      console.log(
        `[CareConnect Backend] Server running in ${
          process.env.NODE_ENV || 'development'
        } mode on port ${PORT}`
      );
      console.log(
        `[CareConnect Backend] Health: http://localhost:${PORT}/api/v1/health`
      );
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(
          `[Server Startup Error] Port ${PORT} is already in use.`
        );
      } else {
        console.error(`[Server Startup Error] ${error.message}`);
      }

      process.exit(1);
    });
  } catch (error) {
    console.error(`[Server Startup Error] Database connection failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();