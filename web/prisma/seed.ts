import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // --- Mock Addresses ---
  const creator1 = '0x32ff5fdf9cb8be86dd9be6d5904717a1348b3917bc270305745e08123981ec30';
  const miner1 = '0x9999999999999999999999999999999999999999999999999999999999999999';

  // --- Tasks with Multi-Pattern Support ---
  const tasks = [
    {
      task_id: '0x10001',
      creator: creator1,
      reward_amount: '1000000000', // 1 SUI
      pattern: 'cafe,dead', // Multi-pattern: cafe OR dead
      status: 'ACTIVE',
      created_at: new Date(),
      timestamp_ms: BigInt(Date.now()),
    },
    {
      task_id: '0x10002',
      creator: creator1,
      reward_amount: '2000000000', // 2 SUI
      pattern: 'beef', // Single pattern
      status: 'ACTIVE',
      created_at: new Date(),
      timestamp_ms: BigInt(Date.now()),
    },
    {
      task_id: '0x10003',
      creator: creator1,
      reward_amount: '500000000', // 0.5 SUI
      pattern: '1234,5678,abcd', // Multi-pattern: 1234 OR 5678 OR abcd
      status: 'ACTIVE',
      created_at: new Date(),
      timestamp_ms: BigInt(Date.now()),
    },
    {
      task_id: '0x10004',
      creator: creator1,
      reward_amount: '3000000000', // 3 SUI
      pattern: '0000',
      status: 'COMPLETED',
      completer: miner1,
      created_at: new Date(Date.now() - 86400000), // 1 day ago
      timestamp_ms: BigInt(Date.now() - 86400000),
    },
    {
      task_id: '0x10005',
      creator: creator1,
      reward_amount: '1500000000', // 1.5 SUI
      pattern: 'aaaa,bbbb,cccc,dddd', // Multi-pattern
      status: 'ACTIVE',
      created_at: new Date(),
      timestamp_ms: BigInt(Date.now()),
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
      type: '0x2::package::UpgradeCap',
      status: 'ACTIVE',
      created_at: new Date(),
      timestamp_ms: BigInt(Date.now()),
    },
    {
      listing_id: '0x20002',
      seller: creator1,
      price: '500000000', // 0.5 SUI
      type: '0x2::coin::Coin<0x2::sui::SUI>',
      status: 'SOLD',
      buyer: miner1,
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
