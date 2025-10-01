import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Layout from "../../components/Layout";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import VariablesPage from "./_components/VariablesPage";

export default async function  VariableDashboardPage() {
const { userId } = await auth();

if (!userId) {
    redirect("/sign-in");
}

return (
    <Layout>
    <Suspense
        fallback={
        <div className="flex items-center justify-center h-screen bg-white">
            Loading Variables Elements...
        </div>
        }
    >
        <Navbar/>
        <VariablesPage/>
    </Suspense>
    </Layout>
);
}
