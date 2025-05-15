/*
  Warnings:

  - Added the required column `active` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `owner` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('Easy', 'Medium', 'Hard');

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "active" BOOLEAN NOT NULL,
ADD COLUMN     "difficulty" "Difficulty" NOT NULL DEFAULT 'Easy',
ADD COLUMN     "owner" TEXT NOT NULL;
