import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Layout from "../../../../components/Layout";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import PayrollJournalPage from "./_components/PayrollJournalPage";

export const metadata = {
title: "Payroll Journal - NewLight Academy Payroll Management",
description: "Payroll Journal page for the payroll management application",
};

export default async function PayrollJournalDashboardPage() {
const { userId } = await auth();

if (!userId) {
    redirect("/sign-in");
}

return (
    <Layout>
    <Suspense
        fallback={
        <div className="flex items-center justify-center h-screen bg-white">
            Loading Payroll Journal...
        </div>
        }
    >
        <Navbar/>
        <PayrollJournalPage/>
    </Suspense>
    </Layout>
);
}
