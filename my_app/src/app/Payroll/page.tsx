// app/dashboard/admin/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Layout from "../../components/Layout";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import PayrollPage from "./_components/PayrollPage";

export const metadata = {
  title: "Payroll - NewLight Aademy Payroll Management",
  description: "Payroll page for the payroll management application",
};

export default async function OurPayrollPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <Layout>
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen bg-white">
          Loading Payrolls...
        </div>
      }>
      <Navbar />
        <PayrollPage/>
      </Suspense>
    </Layout>
  );
}
