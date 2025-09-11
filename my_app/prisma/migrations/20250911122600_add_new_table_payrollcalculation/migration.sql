/*
  Warnings:

  - Added the required column `representationAllowance` to the `PayrollCalculation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."PayrollCalculation" ADD COLUMN     "representationAllowance" DOUBLE PRECISION NOT NULL;
