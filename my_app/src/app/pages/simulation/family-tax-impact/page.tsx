import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Layout from "../../../../components/Layout";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import FamilyTaxImpactPage from "./_components/FamilyTaxImpact";

export const metadata = {
title: "Family Tax Impact - NewLight Academy Payroll Management",
description: "Family Tax Impact page for the payroll management application",
};

export default async function FamilyTaxImpactDashboardPage() {
const { userId } = await auth();

if (!userId) {
    redirect("/sign-in");
}

return (
    <Layout>
    <Suspense
        fallback={
        <div className="flex items-center justify-center h-screen bg-white">
            Loading Family Tax Impact...
        </div>
        }
    >
        <Navbar/>
        <FamilyTaxImpactPage/>
    </Suspense>
    </Layout>
);
}
