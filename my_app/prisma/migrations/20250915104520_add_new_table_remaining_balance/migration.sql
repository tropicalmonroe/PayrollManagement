/*
  Warnings:

  - Added the required column `remainingBalance` to the `CreditInstallment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."CreditInstallment" ADD COLUMN     "remainingBalance" DOUBLE PRECISION NOT NULL;
