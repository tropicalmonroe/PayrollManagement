import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Layout from "../../../../components/Layout";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import IncometaxstatementPage from "./_components/Incometaxstatement";

export const metadata = {
title: "Income tax statement - NewLight Academy Payroll Management",
description: "Income tax statement page for the payroll management application",
};

export default async function IncometaxstatementDashboardPage() {
const { userId } = await auth();

if (!userId) {
    redirect("/sign-in");
}

return (
    <Layout>
    <Suspense
        fallback={
        <div className="flex items-center justify-center h-screen bg-white">
            Loading Income tax statement...
        </div>
        }
    >
        <Navbar />
        <IncometaxstatementPage/>
    </Suspense>
    </Layout>
);
}
