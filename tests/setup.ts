import fs from 'fs';
import path from 'path';
import { prisma } from '../src/database/prisma';

const devDbPath = path.resolve(__dirname, '../prisma/dev.db');
const testDbPath = path.resolve(__dirname, '../prisma/test.db');

beforeAll(async () => {
  // Ensure test database exists by copying dev schema structure if needed
  if (fs.existsSync(devDbPath)) {
    fs.copyFileSync(devDbPath, testDbPath);
  }
  await prisma.$connect();
});

beforeEach(async () => {
  // Clean tables before each test to ensure complete test isolation
  await prisma.note.deleteMany();
  await prisma.lead.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
  try {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    const journal = `${testDbPath}-journal`;
    if (fs.existsSync(journal)) fs.unlinkSync(journal);
  } catch {
    // Ignore cleanup errors on Windows
  }
});
