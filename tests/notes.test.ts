import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/database/prisma';

describe('Notes API Endpoints', () => {
  describe('POST /api/leads/:id/notes', () => {
    it('should create a note for an existing lead', async () => {
      const lead = await prisma.lead.create({
        data: {
          name: 'Target Lead',
          email: 'note.target@example.com',
        },
      });

      const response = await request(app).post(`/api/leads/${lead.id}/notes`).send({
        content: 'Spoke with lead at conference, very interested in pilot.',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        leadId: lead.id,
        content: 'Spoke with lead at conference, very interested in pilot.',
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
    });

    it('should reject note with empty content', async () => {
      const lead = await prisma.lead.create({
        data: { name: 'Empty Note Lead', email: 'empty.note@example.com' },
      });

      const response = await request(app)
        .post(`/api/leads/${lead.id}/notes`)
        .send({ content: '   ' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject note creation for a nonexistent lead with 404', async () => {
      const response = await request(app)
        .post('/api/leads/99999/notes')
        .send({ content: 'Orphan note attempt' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should reject note creation with invalid lead ID with 400', async () => {
      const response = await request(app)
        .post('/api/leads/invalid-id/notes')
        .send({ content: 'Invalid ID test' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/leads/:id/notes', () => {
    it('should list all notes for an existing lead', async () => {
      const lead = await prisma.lead.create({
        data: {
          name: 'Notes List Lead',
          email: 'notes.list@example.com',
          notes: {
            create: [{ content: 'First note created' }, { content: 'Second note created' }],
          },
        },
      });

      const response = await request(app).get(`/api/leads/${lead.id}/notes`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].leadId).toBe(lead.id);
    });

    it('should return empty list when lead has no notes', async () => {
      const lead = await prisma.lead.create({
        data: { name: 'No Notes Lead', email: 'no.notes@example.com' },
      });

      const response = await request(app).get(`/api/leads/${lead.id}/notes`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return 404 when listing notes for nonexistent lead', async () => {
      const response = await request(app).get('/api/leads/88888/notes');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 when lead ID format is invalid', async () => {
      const response = await request(app).get('/api/leads/bad-id/notes');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
