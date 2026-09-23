-- AlterEnum
ALTER TYPE "ExpenseType" ADD VALUE 'SELF_DEBT';

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "note" TEXT;
