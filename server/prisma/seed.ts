import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No user found. Please create a user first.');
    return;
  }

  const account = await prisma.account.create({
    data: {
      name: 'Main Account',
      type: 'CHECKING',
      userId: user.id,
      balance: 0,
      currency: 'USD',
      isDefault: true,
    },
  });

  console.log('Created default account:', account);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
