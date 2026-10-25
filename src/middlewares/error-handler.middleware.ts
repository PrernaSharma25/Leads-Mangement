import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error';
import { env } from '../config/env';

export const errorHandlerMiddleware = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  // Operational AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details ?? undefined,
      },
    });
    return;
  }

  // Zod validation error
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details,
      },
    });
    return;
  }

  // Prisma unique constraint violation (e.g. unique email)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target)
        ? (err.meta.target as string[]).join(', ')
        : 'unique field';

      res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_RESOURCE',
          message: `A record with this ${target} already exists`,
          details: err.meta,
        },
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Requested record does not exist',
        },
      });
      return;
    }
  }

  // JSON Syntax Error in request body
  if (
    err instanceof SyntaxError &&
    'status' in err &&
    (err as { status: unknown }).status === 400
  ) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MALFORMED_JSON',
        message: 'Request body contains invalid JSON',
      },
    });
    return;
  }

  // Unhandled / 500 error
  // eslint-disable-next-line no-console
  console.error('Unhandled internal server error:', err);

  const isProduction = env.NODE_ENV === 'production';
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isProduction
        ? 'An unexpected server error occurred'
        : (err as Error)?.message || 'Internal Server Error',
      ...(isProduction ? {} : { stack: (err as Error)?.stack }),
    },
  });
};
