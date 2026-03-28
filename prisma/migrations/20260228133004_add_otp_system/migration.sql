-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "otpExpiry" TIMESTAMP(3),
ADD COLUMN     "otpHash" TEXT,
ALTER COLUMN "name" DROP NOT NULL;
