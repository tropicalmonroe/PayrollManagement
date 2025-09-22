import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Layout from "../../../../components/Layout";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import MonthlyVariablesPage from "./_components/MonthlyVariablesPage";

export const metadata = {
title: "Monthly Variables - NewLight Academy Payroll Management",
description: "Monthly variables page for the payroll management application",
};

export default async function MonthlyVariablesDashboardPage() {
const { userId } = await auth();

if (!userId) {
    redirect("/sign-in");
}

return (
    <Layout>
    <Suspense
        fallback={
        <div className="flex items-center justify-center h-screen bg-white">
            Loading Monthly Variables...
        </div>
        }
    >
        <Navbar />
        <MonthlyVariablesPage/>
    </Suspense>
    </Layout>
);
}
