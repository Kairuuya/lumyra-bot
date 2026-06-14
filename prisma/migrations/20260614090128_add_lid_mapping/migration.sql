-- CreateTable
CREATE TABLE "lid_mappings" (
    "lid" TEXT NOT NULL,
    "pn" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lid_mappings_pkey" PRIMARY KEY ("lid")
);

-- CreateIndex
CREATE UNIQUE INDEX "lid_mappings_pn_key" ON "lid_mappings"("pn");
