// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.create({
        data: {
            clerkId: 'test-clerk-id',
            email: 'test@example.com',  // <-- add this
            role: 'STUDENT',
            profile: {
                create: {
                    name: 'Simeon',
                    bio: 'Тестов профил'
                }
            }
        },
    });

    console.log('Seed user created:', user);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
