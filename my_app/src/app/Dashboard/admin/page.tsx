// app/dashboard/admin/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Layout from "../../../components/Layout";
import { Suspense } from "react";
import DashboardComponent from "./_components/DashboardComponent";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Dashboard - AD Capital Payroll Management",
  description: "Dashboard for the payroll management application",
};

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <Layout>
      <Suspense fallback={<div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-zinc-800/50">Loading dashboard...</div>}>
      <Navbar />
        <DashboardComponent/>
      </Suspense>
    </Layout>
  );
}
