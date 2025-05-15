/*
  Warnings:

  - You are about to drop the column `Answer` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `Difficulty` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `Hints` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `Time` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `Type` on the `Question` table. All the data in the column will be lost.
  - Changed the type of `lobbyId` on the `Message` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `difficulty` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `input_example` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `output_example` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `topic` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `language` to the `Solution` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_rid_fkey";

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "lobbyId",
ADD COLUMN     "lobbyId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "Answer",
DROP COLUMN "Difficulty",
DROP COLUMN "Hints",
DROP COLUMN "Time",
DROP COLUMN "Type",
ADD COLUMN     "difficulty" "Difficulty" NOT NULL,
ADD COLUMN     "input_example" TEXT NOT NULL,
ADD COLUMN     "output_example" TEXT NOT NULL,
ADD COLUMN     "topic" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Solution" ADD COLUMN     "language" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_rid_fkey" FOREIGN KEY ("rid") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
