import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Layout from "../../components/Layout";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import SettingsPage from "./_components/SettingsPage";

export default async function  SettingsPageDashboardPage() {
const { userId } = await auth();

if (!userId) {
    redirect("/sign-in");
}

return (
    <Layout>
    <Suspense
        fallback={
        <div className="flex items-center justify-center h-screen bg-white">
            Loading Settings...
        </div>
        }
    >
        <Navbar/>
        <SettingsPage/>
    </Suspense>
    </Layout>
);
}
