import app from './app';
import { env } from './config/env';
import { prisma } from './database/prisma';

const server = app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Server listening on http://localhost:${env.PORT}`);
  // eslint-disable-next-line no-console
  console.log(`📚 Swagger documentation available at http://localhost:${env.PORT}/api-docs`);
  // eslint-disable-next-line no-console
  console.log(`🩺 Health check available at http://localhost:${env.PORT}/health`);
});

const gracefulShutdown = async (signal: string) => {
  // eslint-disable-next-line no-console
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    // eslint-disable-next-line no-console
    console.log('HTTP server closed.');
    try {
      await prisma.$disconnect();
      // eslint-disable-next-line no-console
      console.log('Prisma disconnected.');
      process.exit(0);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error disconnecting Prisma:', err);
      process.exit(1);
    }
  });

  // Force close after 10s timeout
  setTimeout(() => {
    // eslint-disable-next-line no-console
    console.error('Forcefully terminating server after timeout.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default server;
