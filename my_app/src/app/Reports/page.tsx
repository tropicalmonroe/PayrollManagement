// app/dashboard/admin/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Layout from "../../components/Layout";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import ReportsPage from "./_components/ReportsPage";

export const metadata = {
  title: "Reports - NewLight Aademy Payroll Management",
  description: "Reports page for the payroll management application",
};

export default async function OurReportsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <Layout>
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen bg-white">
          Loading Reports...
        </div>
      }>
      <Navbar />
        <ReportsPage/>
      </Suspense>
    </Layout>
  );
}
