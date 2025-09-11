-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'USER', 'VIEWER');

-- CreateEnum
CREATE TYPE "public"."MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');

-- CreateEnum
CREATE TYPE "public"."EmployeeStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED', 'RETIRED');

-- CreateEnum
CREATE TYPE "public"."AdvanceStatus" AS ENUM ('IN_PROGRESS', 'REPAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."CreditType" AS ENUM ('HOUSING', 'CONSUMER');

-- CreateEnum
CREATE TYPE "public"."CreditStatus" AS ENUM ('ACTIVE', 'PAID_OFF', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."InstallmentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."VariableElementType" AS ENUM ('OVERTIME', 'ABSENCE', 'BONUS', 'LEAVE', 'LATENESS', 'ADVANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('PAYSLIP', 'SALARY_CERTIFICATE', 'ACCOUNT_STATEMENT', 'PAYROLL_JOURNAL', 'BULK_TRANSFER', 'TAX_REPORT');

-- CreateEnum
CREATE TYPE "public"."DocumentStatus" AS ENUM ('GENERATED', 'SENT', 'ARCHIVED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "profileImage" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Employee" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "idNumber" TEXT,
    "kraPin" TEXT,
    "nssfNumber" TEXT,
    "maritalStatus" "public"."MaritalStatus" NOT NULL DEFAULT 'SINGLE',
    "dateOfBirth" TIMESTAMP(3),
    "hireDate" TIMESTAMP(3) NOT NULL,
    "seniority" INTEGER NOT NULL DEFAULT 0,
    "numberOfDaysPerMonth" INTEGER NOT NULL DEFAULT 26,
    "baseSalary" DOUBLE PRECISION NOT NULL,
    "housingAllowance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transportAllowance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "representationAllowance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mealAllowance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxableGrossSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bankAccount" TEXT,
    "bankBranch" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "loanRepayment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "helbLoan" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subjectToNssf" BOOLEAN NOT NULL DEFAULT true,
    "subjectToShif" BOOLEAN NOT NULL DEFAULT true,
    "subjectToHousingLevy" BOOLEAN NOT NULL DEFAULT true,
    "insurances" JSONB,
    "status" "public"."EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Advance" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "advanceDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "numberOfInstallments" INTEGER NOT NULL,
    "installmentAmount" DOUBLE PRECISION NOT NULL,
    "remainingBalance" DOUBLE PRECISION NOT NULL,
    "status" "public"."AdvanceStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "fullRepaymentDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Advance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Credit" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "public"."CreditType" NOT NULL,
    "loanAmount" DOUBLE PRECISION NOT NULL,
    "interestRate" DOUBLE PRECISION NOT NULL,
    "durationYears" INTEGER NOT NULL,
    "monthlyPayment" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "remainingBalance" DOUBLE PRECISION NOT NULL,
    "amountRepaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "public"."CreditStatus" NOT NULL DEFAULT 'ACTIVE',
    "bank" TEXT NOT NULL,
    "accountNumber" TEXT,
    "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CreditInstallment" (
    "id" TEXT NOT NULL,
    "creditId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "totalMonthlyPayment" DOUBLE PRECISION NOT NULL,
    "principal" DOUBLE PRECISION NOT NULL,
    "interest" DOUBLE PRECISION NOT NULL,
    "interestTax" DOUBLE PRECISION NOT NULL,
    "insurance" DOUBLE PRECISION NOT NULL,
    "remainingPrincipal" DOUBLE PRECISION NOT NULL,
    "status" "public"."InstallmentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentDate" TIMESTAMP(3),
    "amountPaid" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VariableElement" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "public"."VariableElementType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "hours" DOUBLE PRECISION,
    "rate" DOUBLE PRECISION,
    "date" TIMESTAMP(3) NOT NULL,
    "month" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VariableElement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PayrollCalculation" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "baseSalary" DOUBLE PRECISION NOT NULL,
    "housingAllowance" DOUBLE PRECISION NOT NULL,
    "mealAllowance" DOUBLE PRECISION NOT NULL,
    "transportAllowance" DOUBLE PRECISION NOT NULL,
    "overtimePay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bonuses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossSalary" DOUBLE PRECISION NOT NULL,
    "taxableGrossSalary" DOUBLE PRECISION NOT NULL,
    "nssfEmployee" DOUBLE PRECISION NOT NULL,
    "shif" DOUBLE PRECISION NOT NULL,
    "housingLevyEmployee" DOUBLE PRECISION NOT NULL,
    "paye" DOUBLE PRECISION NOT NULL,
    "personalRelief" DOUBLE PRECISION NOT NULL DEFAULT 2400,
    "helb" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherDeductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "numberOfDeductions" INTEGER NOT NULL DEFAULT 0,
    "totalDeductions" DOUBLE PRECISION NOT NULL,
    "nssfEmployer" DOUBLE PRECISION NOT NULL,
    "housingLevyEmployer" DOUBLE PRECISION NOT NULL,
    "totalEmployerContributions" DOUBLE PRECISION NOT NULL,
    "taxableIncome" DOUBLE PRECISION NOT NULL,
    "netSalary" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollCalculation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Document" (
    "id" TEXT NOT NULL,
    "type" "public"."DocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "employeeId" TEXT,
    "period" TEXT NOT NULL,
    "generationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "status" "public"."DocumentStatus" NOT NULL DEFAULT 'GENERATED',
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "fileUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CompanySettings" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyAddress" TEXT,
    "companyPhone" TEXT,
    "companyEmail" TEXT,
    "nssfRate" DOUBLE PRECISION NOT NULL DEFAULT 0.06,
    "nssfMaxContribution" DOUBLE PRECISION NOT NULL DEFAULT 4320,
    "shifRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0275,
    "shifMinContribution" DOUBLE PRECISION NOT NULL DEFAULT 300,
    "housingLevyRate" DOUBLE PRECISION NOT NULL DEFAULT 0.015,
    "personalRelief" DOUBLE PRECISION NOT NULL DEFAULT 2400,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeId_key" ON "public"."Employee"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_idNumber_key" ON "public"."Employee"("idNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_kraPin_key" ON "public"."Employee"("kraPin");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_nssfNumber_key" ON "public"."Employee"("nssfNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CreditInstallment_creditId_installmentNumber_key" ON "public"."CreditInstallment"("creditId", "installmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollCalculation_employeeId_month_year_key" ON "public"."PayrollCalculation"("employeeId", "month", "year");

-- AddForeignKey
ALTER TABLE "public"."Advance" ADD CONSTRAINT "Advance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Credit" ADD CONSTRAINT "Credit_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CreditInstallment" ADD CONSTRAINT "CreditInstallment_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "public"."Credit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VariableElement" ADD CONSTRAINT "VariableElement_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PayrollCalculation" ADD CONSTRAINT "PayrollCalculation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
