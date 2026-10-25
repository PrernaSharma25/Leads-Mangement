import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { notesController } from './notes.controller';
import { createNoteSchema, leadNoteParamsSchema } from './notes.validation';

export const notesRouter = Router({ mergeParams: true });

notesRouter.get('/', validate({ params: leadNoteParamsSchema }), notesController.getNotes);

notesRouter.post(
  '/',
  validate({ params: leadNoteParamsSchema, body: createNoteSchema }),
  notesController.createNote,
);
