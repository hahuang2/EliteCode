-- CreateTable
CREATE TABLE "Room" (
    "id" SERIAL NOT NULL,
    "maxPeople" INTEGER NOT NULL,
    "numPeople" INTEGER NOT NULL,
    "private" BOOLEAN NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Room_id_key" ON "Room"("id");
