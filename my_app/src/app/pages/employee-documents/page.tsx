import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Layout from "../../../components/Layout";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import EmployeeDocumentsPage from "./_components/EmployeeDocumentsPage";

export const metadata = {
title: "Employee Documents - NewLight Academy Payroll Management",
description: "Employee documents page for the payroll management application",
};

export default async function EmployeeDocumentsDashboardPage() {
const { userId } = await auth();

if (!userId) {
    redirect("/sign-in");
}

return (
    <Layout>
    <Suspense
        fallback={
        <div className="flex items-center justify-center h-screen bg-white">
            Loading Employee Documents...
        </div>
        }
    >
        <Navbar />
        <EmployeeDocumentsPage/>
    </Suspense>
    </Layout>
);
}
