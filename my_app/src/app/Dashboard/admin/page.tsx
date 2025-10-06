// app/dashboard/admin/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Layout from "../../../components/Layout";
import { Suspense } from "react";
import DashboardComponent from "./_components/DashboardComponent";
import Navbar from "@/components/Navbar";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <Layout>
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen bg-white">
          Loading dashboard...
        </div>
      }>
      <Navbar />
        <DashboardComponent/>
      </Suspense>
    </Layout>
  );
}
