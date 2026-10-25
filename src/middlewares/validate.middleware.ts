import { NextFunction, Request, Response } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../errors/app-error';

type RequestValidationSource = 'body' | 'query' | 'params';

interface ValidationSchemaMap {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export const validate = (schemas: ValidationSchemaMap) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const sources: RequestValidationSource[] = ['body', 'query', 'params'];

      for (const source of sources) {
        const schema = schemas[source];
        if (schema) {
          const result = schema.safeParse(req[source]);
          if (!result.success) {
            const details = (result.error as ZodError).issues.map((issue) => ({
              field: issue.path.join('.') || source,
              message: issue.message,
            }));
            throw new ValidationError('Request validation failed', details);
          }

          // In Express 5, req.query is a getter. Mutate properties in-place.
          if (source === 'query' && req.query) {
            for (const key of Object.keys(req.query)) {
              delete (req.query as Record<string, unknown>)[key];
            }
            Object.assign(req.query, result.data);
          } else if (source === 'params' && req.params) {
            for (const key of Object.keys(req.params)) {
              delete (req.params as Record<string, unknown>)[key];
            }
            Object.assign(req.params, result.data);
          } else {
            req.body = result.data;
          }
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
