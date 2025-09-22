import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Layout from "../../../../components/Layout";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import MonthlyCalculationPage from "./_components/MonthlyCalculationPage";

export const metadata = {
title: "Monthly Calculation - NewLight Academy Payroll Management",
description: "Monthly Calculation page for the payroll management application",
};

export default async function MonthlyCalculationDashboardPage() {
const { userId } = await auth();

if (!userId) {
    redirect("/sign-in");
}

return (
    <Layout>
    <Suspense
        fallback={
        <div className="flex items-center justify-center h-screen bg-white">
            Loading Monthly Calculations...
        </div>
        }
    >
        <Navbar />
        <MonthlyCalculationPage/>
    </Suspense>
    </Layout>
);
}
