-- AlterTable
ALTER TABLE "User" ADD COLUMN     "rid" INTEGER;

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "numQuestions" INTEGER NOT NULL,
    "rid" INTEGER NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "Difficulty" "Difficulty" NOT NULL,
    "Hints" TEXT NOT NULL,
    "Answer" TEXT NOT NULL,
    "Type" TEXT NOT NULL,
    "Time" INTEGER NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Solution" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "time" INTEGER NOT NULL,
    "qid" INTEGER NOT NULL,
    "username" TEXT NOT NULL,

    CONSTRAINT "Solution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gameQuestion" (
    "qid" INTEGER NOT NULL,
    "gid" INTEGER NOT NULL,

    CONSTRAINT "gameQuestion_pkey" PRIMARY KEY ("qid","gid")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_id_key" ON "Game"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Question_id_key" ON "Question"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Solution_id_key" ON "Solution"("id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_rid_fkey" FOREIGN KEY ("rid") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_rid_fkey" FOREIGN KEY ("rid") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solution" ADD CONSTRAINT "Solution_qid_fkey" FOREIGN KEY ("qid") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solution" ADD CONSTRAINT "Solution_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameQuestion" ADD CONSTRAINT "gameQuestion_qid_fkey" FOREIGN KEY ("qid") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameQuestion" ADD CONSTRAINT "gameQuestion_gid_fkey" FOREIGN KEY ("gid") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
