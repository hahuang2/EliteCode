/*
  Warnings:

  - Added the required column `totalGames` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalLosses` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalWins` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "totalGames" INTEGER NOT NULL,
ADD COLUMN     "totalLosses" INTEGER NOT NULL,
ADD COLUMN     "totalWins" INTEGER NOT NULL;
