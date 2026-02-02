
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Checking latest task...");
    const task = await prisma.task.findFirst({
        orderBy: {
            created_at: 'desc',
        },
    });

    if (!task) {
        console.log("No tasks found in database.");
        return;
    }

    console.log("Task Type:", task.task_type, "(Expected: 1 for Package, 0 for Object)");
    console.log("Target Type:", task.target_type);
    console.log("Lock Duration:", task.lock_duration_ms?.toString());
    console.log("Pattern:", `Prefix=${task.prefix}, Suffix=${task.suffix}, Contains=${task.contains}`);
    console.log("Bytecode Stored:", task.bytecode ? "Yes (Length: " + task.bytecode.length + ")" : "No");
    if (task.bytecode) {
        console.log("Bytecode Preview:", task.bytecode.substring(0, 50) + "...");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
