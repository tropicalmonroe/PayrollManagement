import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Layout from "../../../../components/Layout";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import TaxStatementPage from "./_components/TaxStatementPage";

export const metadata = {
title: "Tax Statement - NewLight Academy Payroll Management",
description: "Tax Statement page for the payroll management application",
};

export default async function TaxStatementPageDashboardPage() {
const { userId } = await auth();

if (!userId) {
    redirect("/sign-in");
}

return (
    <Layout>
    <Suspense
        fallback={
        <div className="flex items-center justify-center h-screen bg-white">
            Loading Tax Statement...
        </div>
        }
    >
        <Navbar />
        <TaxStatementPage/>
    </Suspense>
    </Layout>
);
}
