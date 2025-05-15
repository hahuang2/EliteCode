/*
  Warnings:

  - Added the required column `numProblems` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "numProblems" INTEGER NOT NULL,
ADD COLUMN     "problemTypes" TEXT[];
