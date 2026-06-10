-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "servedByCounterId" TEXT;

-- CreateIndex
CREATE INDEX "Booking_servedByCounterId_idx" ON "Booking"("servedByCounterId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_servedByCounterId_fkey" FOREIGN KEY ("servedByCounterId") REFERENCES "Counter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
