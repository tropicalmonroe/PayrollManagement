import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Layout from "../../../../components/Layout";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import SalaryCertificatePage from "./_components/SalaryCertificatePage";

export const metadata = {
title: "Salary Certificate - NewLight Academy Payroll Management",
description: "Salary Certificate page for the payroll management application",
};

export default async function SalaryCertificateDashboardPage() {
const { userId } = await auth();

if (!userId) {
    redirect("/sign-in");
}

return (
    <Layout>
    <Suspense
        fallback={
        <div className="flex items-center justify-center h-screen bg-white">
            Loading Salary Certificate...
        </div>
        }
    >
        <Navbar />
        <SalaryCertificatePage/>
    </Suspense>
    </Layout>
);
}
