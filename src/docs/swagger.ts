import fs from 'fs';
import path from 'path';
import { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

export const setupSwagger = (app: Application): void => {
  const localSpecPath = path.join(__dirname, 'openapi.yaml');
  const fallbackSpecPath = path.resolve(process.cwd(), 'src/docs/openapi.yaml');

  const specFilePath = fs.existsSync(localSpecPath) ? localSpecPath : fallbackSpecPath;

  if (fs.existsSync(specFilePath)) {
    const swaggerDocument = YAML.load(specFilePath);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  } else {
    // eslint-disable-next-line no-console
    console.warn(`⚠️ OpenAPI spec file not found at ${specFilePath}. Swagger UI disabled.`);
  }
};
