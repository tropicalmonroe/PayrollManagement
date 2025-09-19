// app/dashboard/admin/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Layout from "../../components/Layout";
import { Suspense } from "react";
import EmployeesPage from "./_components/EmployeesPage";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Dashboard - AD Capital Payroll Management",
  description: "Dashboard for the payroll management application",
};

export default async function OurEmployeesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <Layout>
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen bg-white">
          Loading employees...
        </div>
      }>
      <Navbar />
        <EmployeesPage/>
      </Suspense>
    </Layout>
  );
}
