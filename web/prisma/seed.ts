import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // --- Mock Addresses ---
  // Ensure these match your local wallet or devnet accounts if testing integration
  const creator1 = '0x32ff5fdf9cb8be86dd9be6d5904717a1348b3917bc270305745e08123981ec30';
  const miner1 = '0x9999999999999999999999999999999999999999999999999999999999999999';

  // --- Tasks ---
  const tasks = [
    // 1. Regular Object Task (Active)
    {
      task_id: '0x10001',
      creator: creator1,
      reward_amount: '1000000000', // 1 SUI
      prefix: 'cafe',
      suffix: '',
      contains: '',
      status: 'ACTIVE',
      task_type: 0, // Object
      lock_duration_ms: BigInt(0),
      created_at: new Date(),
      timestamp_ms: BigInt(Date.now()),
    },
    // 2. Package ID Task (Active) - "brand"
    {
      task_id: '0x10002',
      creator: creator1,
      reward_amount: '5000000000', // 5 SUI
      prefix: 'brand',
      suffix: '',
      contains: '',
      status: 'ACTIVE',
      task_type: 1, // Package
      lock_duration_ms: BigInt(0),
      created_at: new Date(),
      timestamp_ms: BigInt(Date.now()),
    },
    // 3. Grace Period Task (Pending) - 24h lock
    {
      task_id: '0x10003',
      creator: creator1,
      reward_amount: '2000000000', // 2 SUI
      prefix: '',
      suffix: 'safe',
      contains: '',
      status: 'PENDING',
      task_type: 0, // Object
      lock_duration_ms: BigInt(86400000), // 24 hours
      created_at: new Date(), // Just created
      timestamp_ms: BigInt(Date.now()),
    },
    // 4. Completed Task
    {
      task_id: '0x10004',
      creator: creator1,
      reward_amount: '3000000000', // 3 SUI
      prefix: '',
      suffix: '',
      contains: 'done',
      status: 'COMPLETED',
      completer: miner1,
      task_type: 0,
      lock_duration_ms: BigInt(0),
      created_at: new Date(Date.now() - 172800000), // 2 days ago
      timestamp_ms: BigInt(Date.now() - 172800000),
    },
    // 5. Package ID Task with Start Delay (e.g. 1 hour)
    {
      task_id: '0x10005',
      creator: creator1,
      reward_amount: '10000000000', // 10 SUI
      prefix: 'premium',
      suffix: '',
      contains: '',
      status: 'PENDING',
      task_type: 1, // Package
      lock_duration_ms: BigInt(3600000), // 1 hour
      created_at: new Date(),
      timestamp_ms: BigInt(Date.now()),
    }
  ];

  console.log(`Seeding ${tasks.length} tasks...`);

  for (const t of tasks) {
    const task = await prisma.task.upsert({
      where: { task_id: t.task_id },
      update: {
        status: t.status,
        task_type: t.task_type,
        lock_duration_ms: t.lock_duration_ms
      },
      create: t,
    });
    console.log(`Created task ${task.task_id} (${t.task_type === 1 ? 'Package' : 'Object'})`);
  }

  // --- Listings (Optional, kept/mocked) ---
  const listings = [
    {
      listing_id: '0x20001',
      seller: miner1,
      price: '1500000000',
      type: '0x2::package::UpgradeCap',
      status: 'ACTIVE',
      created_at: new Date(),
      timestamp_ms: BigInt(Date.now()),
    }
  ];

  for (const l of listings) {
    const listing = await prisma.listing.upsert({
      where: { listing_id: l.listing_id },
      update: {},
      create: l,
    });
    console.log(`Created listing ${listing.listing_id}`);
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
