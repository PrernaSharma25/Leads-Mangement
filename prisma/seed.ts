import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing records to make seed script idempotent
  await prisma.note.deleteMany();
  await prisma.lead.deleteMany();

  const leadsData = [
    {
      name: 'Alice Johnson',
      email: 'alice.johnson@techcorp.io',
      phone: '+1-202-555-0143',
      status: 'new',
      notes: {
        create: [{ content: 'Inbound inquiry submitted via pricing page.' }],
      },
    },
    {
      name: 'Bob Martinez',
      email: 'bob.martinez@growthscale.com',
      phone: '+1-415-555-0182',
      status: 'contacted',
      notes: {
        create: [
          { content: 'Sent discovery questionnaire and product deck.' },
          { content: 'Follow-up call scheduled for Tuesday 10 AM PST.' },
        ],
      },
    },
    {
      name: 'Catherine Zhang',
      email: 'catherine.zhang@fintechpulse.org',
      phone: '+1-646-555-0199',
      status: 'qualified',
      notes: {
        create: [
          { content: 'Confirmed $50k+ budget and Q1 procurement timeline.' },
          { content: 'Security compliance review completed.' },
        ],
      },
    },
    {
      name: 'David Kim',
      email: 'david.kim@retailnext.co',
      phone: null,
      status: 'lost',
      notes: {
        create: [{ content: 'Competitor vendor chosen due to legacy system integration.' }],
      },
    },
    {
      name: 'Elena Rostova',
      email: 'elena.rostova@cloudsphere.net',
      phone: '+44-20-7946-0912',
      status: 'new',
      notes: {
        create: [],
      },
    },
  ];

  for (const lead of leadsData) {
    const createdLead = await prisma.lead.create({
      data: lead,
      include: { notes: true },
    });
    console.log(
      ` Created lead: ${createdLead.name} (${createdLead.email}) [${createdLead.status}] with ${createdLead.notes.length} note(s)`,
    );
  }

  console.log('✅ Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
