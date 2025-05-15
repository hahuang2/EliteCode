/*
  Warnings:

  - You are about to drop the column `gid` on the `Solution` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Solution" DROP CONSTRAINT "Solution_gid_fkey";

-- AlterTable
ALTER TABLE "Solution" DROP COLUMN "gid";
