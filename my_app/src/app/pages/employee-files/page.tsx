import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Layout from "../../../components/Layout";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import EmployeeFilesPage from "./_components/EmployeeFiles";

export const metadata = {
title: "Salary Advances - NewLight Academy Payroll Management",
description: "Salary advances page for the payroll management application",
};

export default async function EmployeeFilesDashboardPage() {
const { userId } = await auth();

if (!userId) {
    redirect("/sign-in");
}

return (
    <Layout>
    <Suspense
        fallback={
        <div className="flex items-center justify-center h-screen bg-white">
            Loading Employee Files...
        </div>
        }
    >
        <Navbar />
        <EmployeeFilesPage/>
    </Suspense>
    </Layout>
);
}
