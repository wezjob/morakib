const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  const email = 'admin@morakib.local';
  const password = 'Morakib@2026!';
  const hashed = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({
    where: { email },
    include: { accounts: true }
  });

  let user;
  if (existing) {
    user = await prisma.user.update({
      where: { email },
      data: {
        name: 'Admin Morakib',
        role: 'ADMIN',
        accounts: {
          deleteMany: { provider: 'credentials', providerAccountId: email },
          create: {
            type: 'credentials',
            provider: 'credentials',
            providerAccountId: email,
            access_token: hashed,
          },
        },
      },
      include: { accounts: true },
    });
  } else {
    user = await prisma.user.create({
      data: {
        email,
        name: 'Admin Morakib',
        role: 'ADMIN',
        accounts: {
          create: {
            type: 'credentials',
            provider: 'credentials',
            providerAccountId: email,
            access_token: hashed,
          },
        },
      },
      include: { accounts: true },
    });
  }

  console.log('RESET_OK');
  console.log('email=' + user.email);
  console.log('role=' + user.role);
  console.log('credentials_accounts=' + user.accounts.filter(a => a.provider === 'credentials').length);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('RESET_ERROR', e.message);
  process.exitCode = 1;
});
