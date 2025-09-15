-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "deviceLibraryIdentifier" TEXT NOT NULL,
    "pushToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pass_registrations" (
    "id" TEXT NOT NULL,
    "passId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "passTypeIdentifier" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pass_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "update_outbox" (
    "id" TEXT NOT NULL,
    "passId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "update_outbox_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "passes" ADD COLUMN     "serialNumber" TEXT,
ADD COLUMN     "lastUpdateTag" TEXT NOT NULL DEFAULT '0',
ADD COLUMN     "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "authToken" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "devices_deviceLibraryIdentifier_key" ON "devices"("deviceLibraryIdentifier");

-- CreateIndex
CREATE UNIQUE INDEX "passes_serialNumber_key" ON "passes"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "pass_registrations_passId_deviceId_key" ON "pass_registrations"("passId", "deviceId");

-- AddForeignKey
ALTER TABLE "pass_registrations" ADD CONSTRAINT "pass_registrations_passId_fkey" FOREIGN KEY ("passId") REFERENCES "passes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pass_registrations" ADD CONSTRAINT "pass_registrations_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "update_outbox" ADD CONSTRAINT "update_outbox_passId_fkey" FOREIGN KEY ("passId") REFERENCES "passes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
