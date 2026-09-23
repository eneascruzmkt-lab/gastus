import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const defaultCategories = [
  "Casa",
  "Saúde",
  "Lazer",
  "Transporte",
  "Educação",
  "Alimentação",
  "Terceiro",
  "Outros",
];

async function main() {
  for (const name of defaultCategories) {
    await prisma.category.upsert({
      where: { id: name.toLowerCase() },
      update: {},
      create: {
        id: name.toLowerCase(),
        name,
        predefined: true,
        userId: null,
      },
    });
  }
  console.log("Seed completed: default categories created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
