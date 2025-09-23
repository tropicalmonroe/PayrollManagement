import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Layout from "../../../../components/Layout";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import RegularizationRecallPage from "./_components/RegularizationRecall";

export const metadata = {
title: "Regularization Recall - NewLight Academy Payroll Management",
description: "Regularization Recall page for the payroll management application",
};

export default async function RegularizationRecallDashboardPage() {
const { userId } = await auth();

if (!userId) {
    redirect("/sign-in");
}

return (
    <Layout>
    <Suspense
        fallback={
        <div className="flex items-center justify-center h-screen bg-white">
            Loading Regularization Recall...
        </div>
        }
    >
        <Navbar/>
        <RegularizationRecallPage/>
    </Suspense>
    </Layout>
);
}
