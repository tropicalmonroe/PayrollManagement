import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Layout from "../../../../components/Layout";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import EmployeeConsultationPage from "./_components/Consultation";

export const metadata = {
title: "Employee Records - NewLight Academy Payroll Management",
description: "Employee records page for the payroll management application",
};

export default async function EmployeeConsultationDashboardPage() {
const { userId } = await auth();

if (!userId) {
    redirect("/sign-in");
}

return (
    <Layout>
    <Suspense
        fallback={
        <div className="flex items-center justify-center h-screen bg-white">
            Loading Employee Consultation...
        </div>
        }
    >
        <Navbar />
        <EmployeeConsultationPage />
    </Suspense>
    </Layout>
);
}
