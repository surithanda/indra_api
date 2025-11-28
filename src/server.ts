import app from './app';
import { testConnection } from './config/database';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Test database connection
    console.log('🔌 Testing database connection...');
    await testConnection();

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════════════════════');
      console.log('🚀 Admin Service Started Successfully');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`📍 Environment: ${NODE_ENV}`);
      console.log(`🌐 Server running on: http://localhost:${PORT}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}${process.env.API_PREFIX || '/api/admin'}`);
      console.log(`💚 Health check: http://localhost:${PORT}/health`);
      console.log('═══════════════════════════════════════════════════════');
      console.log('');
      console.log('📝 Available endpoints:');
      console.log(`   POST   ${process.env.API_PREFIX || '/api/admin'}/auth/login`);
      console.log(`   POST   ${process.env.API_PREFIX || '/api/admin'}/auth/logout`);
      console.log(`   POST   ${process.env.API_PREFIX || '/api/admin'}/auth/refresh`);
      console.log(`   GET    ${process.env.API_PREFIX || '/api/admin'}/auth/me`);
      console.log(`   GET    ${process.env.API_PREFIX || '/api/admin'}/users`);
      console.log(`   GET    ${process.env.API_PREFIX || '/api/admin'}/registrations`);
      console.log(`   GET    ${process.env.API_PREFIX || '/api/admin'}/profiles`);
      console.log(`   GET    ${process.env.API_PREFIX || '/api/admin'}/payments/summary`);
      console.log(`   GET    ${process.env.API_PREFIX || '/api/admin'}/partners/registrations`);
      console.log(`   GET    ${process.env.API_PREFIX || '/api/admin'}/clients`);
      console.log('   ... and more');
      console.log('');
      console.log('📚 Full API documentation: See README.md');
      console.log('');
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      console.log(`\n⚠️  ${signal} received. Starting graceful shutdown...`);
      
      server.close(() => {
        console.log('✅ HTTP server closed');
        console.log('👋 Admin service stopped');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
