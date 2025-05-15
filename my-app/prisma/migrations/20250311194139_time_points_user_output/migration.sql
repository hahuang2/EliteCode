/*
  Warnings:

  - You are about to drop the column `time` on the `Solution` table. All the data in the column will be lost.
  - Added the required column `output` to the `Solution` table without a default value. This is not possible if the table is not empty.
  - Added the required column `points` to the `Solution` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeEnd` to the `Solution` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeStart` to the `Solution` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Solution" DROP COLUMN "time",
ADD COLUMN     "output" TEXT NOT NULL,
ADD COLUMN     "points" INTEGER NOT NULL,
ADD COLUMN     "timeEnd" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "timeStart" TIMESTAMP(3) NOT NULL;
