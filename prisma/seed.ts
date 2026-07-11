import { PrismaClient } from "../generated/prisma/index.js";
import { spawnSync } from "node:child_process";

import { hashPassword } from "../src/utils/password.js";

const adminUsername = process.env.ADMIN_USERNAME?.trim();
const adminPassword = process.env.ADMIN_PASSWORD?.trim();
const prisma = new PrismaClient();

function runMigrations() {
  const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error("Failed to apply Prisma migrations before seeding");
  }
}

async function main() {
  if (!adminUsername || !adminPassword) {
    return;
  }

  runMigrations();

  const existingAdmin = await prisma.user.findFirst({
    where: {
      username: adminUsername,
      role: "ADMIN",
    },
  });

  if (existingAdmin) {
    return;
  }

  const password = await hashPassword(adminPassword);

  await prisma.user.create({
    data: {
      username: adminUsername,
      name: adminUsername,
      password,
      role: "ADMIN",
      status: "ACTIVE",
      mustChangePassword: false,
      studentId: null,
      batchId: null,
      currentSemesterId: null,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
