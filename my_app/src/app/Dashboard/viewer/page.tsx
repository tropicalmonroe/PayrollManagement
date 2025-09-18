// app/dashboard/viewer/page.tsx
import { auth } from '@clerk/nextjs/server';
import { Layout } from '../../../components/Layout';
import { redirect } from 'next/navigation';

export default async function ViewerDashboard() {
const { sessionClaims } = await auth();
const role = (sessionClaims?.metadata as { role?: string })?.role || 'VIEWER';

if (role !== 'VIEWER') {
    redirect(`/sign-in`);
}

return (
    <Layout>
    <div>
        <h2 className="text-2xl font-bold text-zinc-900">Viewer Dashboard</h2>
        <p className="mt-1 text-sm text-zinc-600">Welcome, {role}</p>
    </div>
    </Layout>
);
}