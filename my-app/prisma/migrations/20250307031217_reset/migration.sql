/*
  Warnings:

  - You are about to drop the column `points` on the `Solution` table. All the data in the column will be lost.
  - You are about to drop the column `friends` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Solution" DROP COLUMN "points";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "friends";
