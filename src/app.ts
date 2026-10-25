import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import { setupSwagger } from './docs/swagger';
import { errorHandlerMiddleware } from './middlewares/error-handler.middleware';
import { notFoundMiddleware } from './middlewares/not-found.middleware';
import { leadsRouter } from './modules/leads/leads.routes';

export const createApp = (): Application => {
  const app: Application = express();

  // Core middlewares
  app.use(cors());
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // Swagger Documentation
  setupSwagger(app);

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use('/api/leads', leadsRouter);

  // 404 Not Found handling
  app.use(notFoundMiddleware);

  // Centralized Error Handling
  app.use(errorHandlerMiddleware);

  return app;
};

export const app: Application = createApp();
export default app;
