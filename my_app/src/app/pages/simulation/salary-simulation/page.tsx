import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Layout from "../../../../components/Layout";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import SalarySimulation from "./_components/SalarySimulation";

export const metadata = {
title: "Simulation Salary - NewLight Academy Payroll Management",
description: "Simulation page for salary - the payroll management application",
};

export default async function SalarySimulationDashboardPage() {
const { userId } = await auth();

if (!userId) {
    redirect("/sign-in");
}

return (
    <Layout>
    <Suspense
        fallback={
        <div className="flex items-center justify-center h-screen bg-white">
            Loading Salary Simulation ...
        </div>
        }
    >
        <Navbar />
        <SalarySimulation />
    </Suspense>
    </Layout>
);
}
