import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // --- Mock Addresses ---
  const creator1 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const creator2 = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678';
  const miner1 = '0x9999999999999999999999999999999999999999999999999999999999999999';

  // --- Tasks ---
  const tasks = [
    {
      task_id: '0x10001',
      creator: creator1,
      reward_amount: '1000000000', // 1 SUI
      pattern: 'cafe',
      status: 'PENDING',
      created_at: new Date(),
      timestamp_ms: BigInt(Date.now()),
    },
    {
      task_id: '0x10002',
      creator: creator1,
      reward_amount: '5000000000', // 5 SUI
      pattern: 'beef',
      status: 'ACTIVE',
      created_at: new Date(),
      timestamp_ms: BigInt(Date.now()),
    },
    {
      task_id: '0x10003',
      creator: creator2,
      reward_amount: '2000000000', // 2 SUI
      pattern: 'dead',
      status: 'COMPLETED',
      completer: miner1,
      created_at: new Date(Date.now() - 86400000), // 1 day ago
      timestamp_ms: BigInt(Date.now() - 86400000),
    },
    {
      task_id: '0x10004',
      creator: creator2,
      reward_amount: '500000000', // 0.5 SUI
      pattern: '0000',
      status: 'CANCELLED',
      created_at: new Date(Date.now() - 172800000), // 2 days ago
      timestamp_ms: BigInt(Date.now() - 172800000),
    },
  ];

  for (const t of tasks) {
    const task = await prisma.task.upsert({
      where: { task_id: t.task_id },
      update: {},
      create: t,
    });
    console.log(`Created task with id: ${task.task_id}`);
  }

  // --- Listings ---
  const listings = [
    {
      listing_id: '0x20001',
      seller: miner1,
      price: '1500000000', // 1.5 SUI
      type: '0x...::vanity::VanityAddress<0x...>',
      status: 'ACTIVE',
      created_at: new Date(),
      timestamp_ms: BigInt(Date.now()),
    },
    {
      listing_id: '0x20002',
      seller: creator2,
      price: '500000000', // 0.5 SUI
      type: '0x...::vanity::VanityAddress<0x...>',
      status: 'SOLD',
      buyer: creator1,
      created_at: new Date(Date.now() - 1000000),
      timestamp_ms: BigInt(Date.now() - 1000000),
    },
  ];

  for (const l of listings) {
    const listing = await prisma.listing.upsert({
      where: { listing_id: l.listing_id },
      update: {},
      create: l,
    });
    console.log(`Created listing with id: ${listing.listing_id}`);
  }

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
