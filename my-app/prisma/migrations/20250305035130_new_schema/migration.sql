/*
  Warnings:

  - Added the required column `gid` to the `Solution` table without a default value. This is not possible if the table is not empty.
  - Added the required column `points` to the `Solution` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Solution" ADD COLUMN     "gid" INTEGER NOT NULL,
ADD COLUMN     "points" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "friends" TEXT[];

-- AddForeignKey
ALTER TABLE "Solution" ADD CONSTRAINT "Solution_gid_fkey" FOREIGN KEY ("gid") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
