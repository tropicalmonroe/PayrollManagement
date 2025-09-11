/*
  Warnings:

  - You are about to drop the column `numberOfDeductions` on the `PayrollCalculation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Employee" ADD COLUMN     "numberOfDeductions" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."PayrollCalculation" DROP COLUMN "numberOfDeductions";
