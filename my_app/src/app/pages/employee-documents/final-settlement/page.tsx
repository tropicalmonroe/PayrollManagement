import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Layout from "../../../../components/Layout";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import FinalSettlementPage from "./_components/FinalSettlementPage";

export const metadata = {
title: "Final Settlement - NewLight Academy Payroll Management",
description: "Final Settlements page for the payroll management application",
};

export default async function FinalSettlementDashboardPage() {
const { userId } = await auth();

if (!userId) {
    redirect("/sign-in");
}

return (
    <Layout>
    <Suspense
        fallback={
        <div className="flex items-center justify-center h-screen bg-white">
            Loading Final Settlements...
        </div>
        }
    >
        <Navbar />
        <FinalSettlementPage/>
    </Suspense>
    </Layout>
);
}
