import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Layout from "../../../../components/Layout";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import SalaryAdvancesPage from "./_components/SalaryAdvances";

export const metadata = {
title: "Salary Advances - NewLight Academy Payroll Management",
description: "Salary advances page for the payroll management application",
};

export default async function SalaryAdvancesDashboardPage() {
const { userId } = await auth();

if (!userId) {
    redirect("/sign-in");
}

return (
    <Layout>
    <Suspense
        fallback={
        <div className="flex items-center justify-center h-screen bg-white">
            Loading Salary Advances...
        </div>
        }
    >
        <Navbar />
        <SalaryAdvancesPage/>
    </Suspense>
    </Layout>
);
}
