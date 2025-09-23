import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Layout from "../../../../components/Layout";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import HousingCredit from "./_components/HousingCredit";

export const metadata = {
title: "Housing Credit - NewLight Academy Payroll Management",
description: "Housing credit page for the payroll management application",
};

export default async function HousingCreditDashboardPage() {
const { userId } = await auth();

if (!userId) {
    redirect("/sign-in");
}

return (
    <Layout>
    <Suspense
        fallback={
        <div className="flex items-center justify-center h-screen bg-white">
            Loading Housing Credit...
        </div>
        }
    >
        <Navbar />
        <HousingCredit />
    </Suspense>
    </Layout>
);
}
