import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hash } from "bcryptjs";

async function main() {
  const dbUrl = process.env.DATABASE_URL || "postgresql://morakib:morakib_password@localhost:5433/morakib?schema=public";
  const url = new URL(dbUrl);

  const pool = new Pool({
    host: url.hostname,
    port: parseInt(url.port || "5432"),
    database: url.pathname.slice(1).split("?")[0],
    user: url.username,
    password: url.password,
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const email = "admin@morakib.local";
  const password = "Morakib@2026!";
  const hashedPassword = await hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });

  const user = existing
    ? await prisma.user.update({
        where: { email },
        data: {
          name: "Admin Morakib",
          role: "ADMIN",
          accounts: {
            deleteMany: { provider: "credentials", providerAccountId: email },
            create: {
              type: "credentials",
              provider: "credentials",
              providerAccountId: email,
              access_token: hashedPassword,
            },
          },
        },
      })
    : await prisma.user.create({
        data: {
          email,
          name: "Admin Morakib",
          role: "ADMIN",
          accounts: {
            create: {
              type: "credentials",
              provider: "credentials",
              providerAccountId: email,
              access_token: hashedPassword,
            },
          },
        },
      });

  console.log("RESET_OK");
  console.log(`email=${user.email}`);
  console.log(`role=${user.role}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error("RESET_ERROR_MESSAGE", e?.message || "");
  console.error("RESET_ERROR_NAME", e?.name || "");
  console.error("RESET_ERROR_STACK", e?.stack || "");
  console.error("RESET_ERROR_RAW", e);
  process.exit(1);
});
