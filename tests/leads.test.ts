import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/database/prisma';

describe('Leads API Endpoints', () => {
  describe('POST /api/leads', () => {
    it('should create a valid lead with default status "new"', async () => {
      const response = await request(app).post('/api/leads').send({
        name: 'Sarah Connor',
        email: 'sarah.connor@sky.net',
        phone: '+1-555-0101',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: 'Sarah Connor',
        email: 'sarah.connor@sky.net',
        phone: '+1-555-0101',
        status: 'new',
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
    });

    it('should create a lead with specified status', async () => {
      const response = await request(app).post('/api/leads').send({
        name: 'John Connor',
        email: 'john.connor@resistance.org',
        status: 'qualified',
      });

      expect(response.status).toBe(201);
      expect(response.body.data.status).toBe('qualified');
    });

    it('should reject invalid lead data (missing name)', async () => {
      const response = await request(app).post('/api/leads').send({
        email: 'missing.name@example.com',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid lead data (invalid email format)', async () => {
      const response = await request(app).post('/api/leads').send({
        name: 'Bad Email User',
        email: 'not-an-email',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid lead data (unsupported status)', async () => {
      const response = await request(app).post('/api/leads').send({
        name: 'Unknown Status User',
        email: 'status@example.com',
        status: 'pending',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject duplicate email with 409 Conflict', async () => {
      await prisma.lead.create({
        data: {
          name: 'Existing Lead',
          email: 'duplicate@test.com',
        },
      });

      const response = await request(app).post('/api/leads').send({
        name: 'Another Person',
        email: 'duplicate@test.com',
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
    });
  });

  describe('GET /api/leads', () => {
    beforeEach(async () => {
      await prisma.lead.createMany({
        data: [
          { name: 'Alice Smith', email: 'alice@acme.com', status: 'new' },
          { name: 'Bob Jones', email: 'bob@beta.org', status: 'contacted' },
          { name: 'Charlie Brown', email: 'charlie@acme.com', status: 'qualified' },
          { name: 'Diana Prince', email: 'diana@amazon.com', status: 'lost' },
        ],
      });
    });

    it('should fetch all leads with pagination metadata', async () => {
      const response = await request(app).get('/api/leads');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(4);
      expect(response.body.pagination).toEqual({
        total: 4,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should filter leads by status', async () => {
      const response = await request(app).get('/api/leads?status=qualified');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Charlie Brown');
      expect(response.body.pagination.total).toBe(1);
    });

    it('should search leads by name', async () => {
      const response = await request(app).get('/api/leads?search=Bob');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].email).toBe('bob@beta.org');
    });

    it('should search leads by email domain', async () => {
      const response = await request(app).get('/api/leads?search=acme.com');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });

    it('should respect pagination parameters (page and limit)', async () => {
      const page1 = await request(app).get('/api/leads?page=1&limit=2');
      expect(page1.status).toBe(200);
      expect(page1.body.data).toHaveLength(2);
      expect(page1.body.pagination).toEqual({
        total: 4,
        page: 1,
        limit: 2,
        totalPages: 2,
      });

      const page2 = await request(app).get('/api/leads?page=2&limit=2');
      expect(page2.status).toBe(200);
      expect(page2.body.data).toHaveLength(2);
      expect(page2.body.pagination.page).toBe(2);
    });
  });

  describe('GET /api/leads/:id', () => {
    it('should retrieve a single lead with notes', async () => {
      const lead = await prisma.lead.create({
        data: {
          name: 'Inspect Lead',
          email: 'inspect@example.com',
          notes: {
            create: [{ content: 'First test note' }],
          },
        },
      });

      const response = await request(app).get(`/api/leads/${lead.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(lead.id);
      expect(response.body.data.notes).toHaveLength(1);
      expect(response.body.data.notes[0].content).toBe('First test note');
    });

    it('should return 404 for a nonexistent lead', async () => {
      const response = await request(app).get('/api/leads/99999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for an invalid ID format', async () => {
      const response = await request(app).get('/api/leads/abc');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PATCH /api/leads/:id', () => {
    it('should partially update an existing lead', async () => {
      const lead = await prisma.lead.create({
        data: {
          name: 'Initial Name',
          email: 'initial@update.com',
          status: 'new',
        },
      });

      const response = await request(app).patch(`/api/leads/${lead.id}`).send({
        name: 'Updated Name',
        status: 'contacted',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.status).toBe('contacted');
      expect(response.body.data.email).toBe('initial@update.com');
    });

    it('should return 400 when body is empty', async () => {
      const lead = await prisma.lead.create({
        data: { name: 'Lead', email: 'empty@update.com' },
      });

      const response = await request(app).patch(`/api/leads/${lead.id}`).send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 when updating a nonexistent lead', async () => {
      const response = await request(app).patch('/api/leads/88888').send({ name: 'Nobody' });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should reject email collision with 409 Conflict', async () => {
      await prisma.lead.create({
        data: { name: 'Lead 1', email: 'taken@example.com' },
      });
      const lead2 = await prisma.lead.create({
        data: { name: 'Lead 2', email: 'lead2@example.com' },
      });

      const response = await request(app)
        .patch(`/api/leads/${lead2.id}`)
        .send({ email: 'taken@example.com' });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('CONFLICT');
    });
  });

  describe('DELETE /api/leads/:id', () => {
    it('should delete a lead and cascade delete its associated notes', async () => {
      const lead = await prisma.lead.create({
        data: {
          name: 'Delete Target',
          email: 'delete@target.com',
          notes: {
            create: [{ content: 'Cascade note 1' }, { content: 'Cascade note 2' }],
          },
        },
      });

      const response = await request(app).delete(`/api/leads/${lead.id}`);

      expect(response.status).toBe(204);

      // Verify lead is gone from database
      const foundLead = await prisma.lead.findUnique({ where: { id: lead.id } });
      expect(foundLead).toBeNull();

      // Verify notes were cascade deleted
      const notes = await prisma.note.findMany({ where: { leadId: lead.id } });
      expect(notes).toHaveLength(0);
    });

    it('should return 404 when deleting a nonexistent lead', async () => {
      const response = await request(app).delete('/api/leads/77777');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });
});
