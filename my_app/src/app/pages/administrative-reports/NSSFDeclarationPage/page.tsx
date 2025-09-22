import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Layout from "../../../../components/Layout";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import NSSFDeclarationPage from "./_components/NSSFDeclarationPage";

export const metadata = {
title: "NSSF Declaration - NewLight Academy Payroll Management",
description: "NSSF Declaration page for the payroll management application",
};

export default async function NSSFDeclarationDashboardPage() {
const { userId } = await auth();

if (!userId) {
    redirect("/sign-in");
}

return (
    <Layout>
    <Suspense
        fallback={
        <div className="flex items-center justify-center h-screen bg-white">
            Loading NSSF Declaration...
        </div>
        }
    >
        <Navbar />
        <NSSFDeclarationPage/>
    </Suspense>
    </Layout>
);
}
