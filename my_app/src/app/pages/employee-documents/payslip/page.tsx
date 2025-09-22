import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Layout from "../../../../components/Layout";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import PayslipPage from "./_components/PayslipPage";

export const metadata = {
title: "Payslip - NewLight Academy Payroll Management",
description: "Payslip page for the payroll management application",
};

export default async function PayslipDashboardPage() {
const { userId } = await auth();

if (!userId) {
    redirect("/sign-in");
}

return (
    <Layout>
    <Suspense
        fallback={
        <div className="flex items-center justify-center h-screen bg-white">
            Loading Payslips...
        </div>
        }
    >
        <Navbar />
        <PayslipPage/>
    </Suspense>
    </Layout>
);
}
