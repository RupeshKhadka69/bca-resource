import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/utils/password.js";

const adminUsername = process.env.ADMIN_USERNAME?.trim();
const adminPassword = process.env.ADMIN_PASSWORD?.trim();

const prisma = new PrismaClient();

async function main() {
  if (!adminUsername || !adminPassword) {
    throw new Error(
      "ADMIN_USERNAME and ADMIN_PASSWORD are required for seeding",
    );
  }

  const existingAdmin = await prisma.user.findFirst({
    where: {
      username: adminUsername,
      role: "ADMIN",
    },
  });

  if (existingAdmin) {
    console.log("Admin already exists");
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

  console.log("Admin created successfully");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });