import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { notesRouter } from '../notes/notes.routes';
import { leadsController } from './leads.controller';
import {
  createLeadSchema,
  leadIdParamSchema,
  leadQuerySchema,
  updateLeadSchema,
} from './leads.validation';

export const leadsRouter = Router();

// Nested notes resource: /api/leads/:id/notes
leadsRouter.use('/:id/notes', notesRouter);

leadsRouter.get('/', validate({ query: leadQuerySchema }), leadsController.getLeads);

leadsRouter.post('/', validate({ body: createLeadSchema }), leadsController.createLead);

leadsRouter.get('/:id', validate({ params: leadIdParamSchema }), leadsController.getLeadById);

leadsRouter.patch(
  '/:id',
  validate({ params: leadIdParamSchema, body: updateLeadSchema }),
  leadsController.updateLead,
);

leadsRouter.delete('/:id', validate({ params: leadIdParamSchema }), leadsController.deleteLead);
