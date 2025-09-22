import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Layout from "../../../../components/Layout";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import BankTransferPage from "./_components/BankTransferPage";

export const metadata = {
title: "Bank Transfer - NewLight Academy Payroll Management",
description: "Bank Transfer page for the payroll management application",
};

export default async function BankTransferPageDashboardPage() {
const { userId } = await auth();

if (!userId) {
    redirect("/sign-in");
}

return (
    <Layout>
    <Suspense
        fallback={
        <div className="flex items-center justify-center h-screen bg-white">
            Loading Bank Transfer...
        </div>
        }
    >
        <Navbar />
        <BankTransferPage/>
    </Suspense>
    </Layout>
);
}
